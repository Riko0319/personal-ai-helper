const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('rulerAPI', {
    // 发送测量结果
    sendMeasurement: (data) => ipcRenderer.send('ruler-measurement', data),
    // 取消测量
    cancelMeasurement: () => ipcRenderer.send('ruler-cancel')
});
