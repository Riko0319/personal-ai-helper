import * as XLSX from 'xlsx';

export const exportToExcel = {
    name: 'export_to_excel',
    description: '将数据导出为Excel文件，支持JSON数组、表格数据等格式',
    parameters: {
        type: 'object',
        properties: {
            data: {
                type: 'array',
                description: '要导出的数据，是一个对象数组',
                items: {
                    type: 'object'
                }
            },
            fileName: {
                type: 'string',
                description: '导出的文件名（不含扩展名），默认为export'
            },
            sheetName: {
                type: 'string',
                description: '工作表名称，默认为Sheet1'
            }
        },
        required: ['data']
    },
    execute: async (args) => {
        try {
            const { data, fileName = 'export', sheetName = 'Sheet1' } = args;

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('数据必须是非空数组');
            }

            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return {
                success: true,
                message: `Excel文件已成功导出: ${fileName}.xlsx`,
                rowCount: data.length,
                columnCount: Object.keys(data[0] || {}).length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
};

export const parseTableData = {
    name: 'parse_table_data',
    description: '解析文本格式的表格数据，转换为JSON数组',
    parameters: {
        type: 'object',
        properties: {
            text: {
                type: 'string',
                description: '包含表格数据的文本，可以是Markdown表格、CSV或其他格式'
            },
            format: {
                type: 'string',
                description: '表格格式：markdown、csv、tsv，默认自动检测',
                enum: ['markdown', 'csv', 'tsv', 'auto']
            }
        },
        required: ['text']
    },
    execute: async (args) => {
        try {
            const { text, format = 'auto' } = args;
            let data = [];
            let detectedFormat = format;

            if (detectedFormat === 'auto') {
                if (text.includes('|') && text.includes('---')) {
                    detectedFormat = 'markdown';
                } else if (text.includes(',')) {
                    detectedFormat = 'csv';
                } else if (text.includes('\t')) {
                    detectedFormat = 'tsv';
                } else {
                    throw new Error('无法自动检测表格格式，请指定格式');
                }
            }

            if (detectedFormat === 'markdown') {
                const lines = text.trim().split('\n').filter(line => line.trim());
                const dataLines = lines.filter(line => !line.includes('---') && line.includes('|'));
                
                if (dataLines.length < 2) {
                    throw new Error('Markdown表格格式不正确');
                }

                const headers = dataLines[0].split('|').map(h => h.trim()).filter(h => h);
                
                data = dataLines.slice(1).map(line => {
                    const values = line.split('|').map(v => v.trim()).filter((v, i) => i > 0 && i <= headers.length);
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    return obj;
                });
            } else if (detectedFormat === 'csv' || detectedFormat === 'tsv') {
                const delimiter = detectedFormat === 'csv' ? ',' : '\t';
                const lines = text.trim().split('\n');
                
                if (lines.length < 2) {
                    throw new Error('CSV/TSV数据至少需要两行');
                }

                const headers = lines[0].split(delimiter).map(h => h.trim());
                
                data = lines.slice(1).map(line => {
                    const values = line.split(delimiter).map(v => v.trim());
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = values[index] || '';
                    });
                    return obj;
                });
            }

            return {
                success: true,
                data,
                format: detectedFormat,
                rowCount: data.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
};
