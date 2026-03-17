import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
    const isLoggedIn = ref(false);
    const username = ref('');

    function setLoggedIn(name) {
        isLoggedIn.value = true;
        username.value = name;
    }

    function logout() {
        isLoggedIn.value = false;
        username.value = '';
        if (window.electronAPI) {
            window.electronAPI.logout();
        }
    }

    return {
        isLoggedIn,
        username,
        setLoggedIn,
        logout
    };
});
