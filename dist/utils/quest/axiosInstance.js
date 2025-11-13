// customAxiosWithProxy.js
const axios = require('axios');
const { generateHeaders } = require('./genrateHeaders.js');

/**
 * useProxy can be:
 * - false/null -> no proxy
 * - { ip: "host:port", authentication: "user:pass" }
 * - or a string like "host:port" (no auth)
 */
const customAxiosWithProxy = (token, useProxy = null) => {
    const headers = generateHeaders(token);
    const config = {
        baseURL: "https://discord.com/api/v9/",
        headers,
        timeout: 10000,
    };

    if (useProxy) {
        // دعم عدة صيغ للـ useProxy
        let hostPort = null;
        let auth = null;

        if (typeof useProxy === "string") {
            hostPort = useProxy;
        } else if (useProxy?.ip) {
            hostPort = useProxy.ip;
            if (useProxy.authentication) auth = useProxy.authentication;
        }

        if (hostPort) {
            const [host, portStr] = hostPort.split(":");
            const port = parseInt(portStr, 10) || undefined;

            if (host && port) {
                config.proxy = {
                    protocol: "http",
                    host,
                    port,
                };

                if (auth) {
                    const [username, password] = auth.split(":");
                    if (username) config.proxy.auth = { username, password: password || "" };
                }
            }
        }
    }

    const axiosInstance = axios.create(config);

    // اختياري - interceptors (حالياً لا يغيرون الطلب)
    axiosInstance.interceptors.request.use(
        (cfg) => cfg,
        (error) => Promise.reject(error)
    );
    axiosInstance.interceptors.response.use(
        (resp) => resp,
        (error) => Promise.reject(error)
    );

    return axiosInstance;
};
