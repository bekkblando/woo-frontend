import Cookies from 'js-cookie';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8003";

const setCsrfToken = async () => {
    const response = await fetch(`${BACKEND_URL}/api/csrf-token/`, { method: 'POST', credentials: 'include' });
    const data = await response.json();
    return data.csrf_token;
};

const setCsrfTokenIfNotPresent = async (): Promise<string> => {
    const csrfToken = Cookies.get('csrftoken');
    if (csrfToken) {
        return csrfToken;
    }else{
        return await setCsrfToken();
    }
};

const getCSRFHeaders = (extraHeaders: Record<string, string> = {}): Record<string, string> => {
    return {
        'X-CSRFToken': Cookies.get('csrftoken') || '',
        ...extraHeaders,
    };
};

export { setCsrfTokenIfNotPresent, setCsrfToken, getCSRFHeaders };