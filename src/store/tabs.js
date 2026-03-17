import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTabStore = defineStore('tabs', () => {
    const tabs = ref([
        { name: 'Home', title: '首页', path: '/home', closable: false }
    ]);
    const activeTab = ref('Home');

    function addTab(tab) {
        const exists = tabs.value.find((t) => t.name === tab.name);
        if (!exists) {
            tabs.value.push(tab);
        }
        activeTab.value = tab.name;
    }

    function removeTab(name) {
        const index = tabs.value.findIndex((t) => t.name === name);
        if (index > -1 && tabs.value[index].closable) {
            tabs.value.splice(index, 1);
            if (activeTab.value === name) {
                activeTab.value = tabs.value[Math.max(0, index - 1)].name;
            }
        }
        return activeTab.value;
    }

    function setActiveTab(name) {
        activeTab.value = name;
    }

    return {
        tabs,
        activeTab,
        addTab,
        removeTab,
        setActiveTab
    };
});
