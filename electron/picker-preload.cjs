const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pickerAPI', {
    // 捕获屏幕
    captureScreen: () => ipcRenderer.invoke('capture-screen'),
    // 发送吸取的颜色
    sendColor: (color) => ipcRenderer.send('picker-color', color),
    // 取消吸色
    cancelPicker: () => ipcRenderer.send('picker-cancel')
});
