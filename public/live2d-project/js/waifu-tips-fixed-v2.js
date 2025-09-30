/*!
 * Live2D Widget - Fixed Version V2
 * https://github.com/stevenjoezhang/live2d-widget
 * Fixed: Type safety and null checks
 */

// Utility functions
function randomSelection(e) {
    return Array.isArray(e) ? e[Math.floor(Math.random() * e.length)] : e;
}

function randomNext(e, t) {
    const s = Math.floor(Math.random() * (e - 1));
    return s >= t ? s + 1 : s;
}

function loadScript(e, t) {
    return new Promise(((t, s) => {
        let o;
        o = document.createElement("script");
        o.src = e;
        if (o) {
            o.onload = () => t(e);
            o.onerror = () => s(e);
            document.head.appendChild(o);
        }
    }));
}

// Message display
let messageTimer = null;

function showMessage(t, s, i, n = true) {
    let l = parseInt(sessionStorage.getItem("waifu-message-priority"), 10);
    if (isNaN(l)) l = 0;
    if (!t || n && l > i || !n && l >= i) return;
    
    if (messageTimer) {
        clearTimeout(messageTimer);
        messageTimer = null;
    }
    
    t = randomSelection(t);
    sessionStorage.setItem("waifu-message-priority", String(i));
    
    const a = document.getElementById("waifu-tips");
    if (a) {
        a.innerHTML = t;
        a.classList.add("waifu-tips-active");
        messageTimer = setTimeout((() => {
            sessionStorage.removeItem("waifu-message-priority");
            a.classList.remove("waifu-tips-active");
        }), s);
    }
}

function formatString(e, ...t) {
    return e.replace(/\$(\d+)/g, ((e, s) => {
        const i = parseInt(s, 10) - 1;
        return t[i] || "";
    }));
}

// Logger class
class Logger {
    constructor(level = "info") {
        this.level = level;
    }
    
    setLevel(level) {
        if (level) this.level = level;
    }
    
    shouldLog(level) {
        return Logger.levelOrder[level] <= Logger.levelOrder[this.level];
    }
    
    error(msg, ...args) {
        if (this.shouldLog("error")) console.error("[Live2D Widget][ERROR]", msg, ...args);
    }
    
    warn(msg, ...args) {
        if (this.shouldLog("warn")) console.warn("[Live2D Widget][WARN]", msg, ...args);
    }
    
    info(msg, ...args) {
        if (this.shouldLog("info")) console.log("[Live2D Widget][INFO]", msg, ...args);
    }
    
    trace(msg, ...args) {
        if (this.shouldLog("trace")) console.log("[Live2D Widget][TRACE]", msg, ...args);
    }
}

Logger.levelOrder = {error: 0, warn: 1, info: 2, trace: 3};
const logger = new Logger();

// Model Manager class
class ModelManager {
    constructor(config, models = []) {
        this.modelList = null;
        let {apiPath, cdnPath} = config;
        const {cubism2Path, cubism5Path} = config;
        let useCDN = false;
        
        // Handle CDN path
        if (typeof cdnPath === "string") {
            if (!cdnPath.endsWith("/")) cdnPath += "/";
            useCDN = true;
        } else if (typeof apiPath === "string") {
            if (!apiPath.endsWith("/")) apiPath += "/";
            cdnPath = apiPath;
            useCDN = true;
            logger.warn("apiPath option is deprecated. Please use cdnPath instead.");
        } else if (!models.length) {
            throw "Invalid initWidget argument!";
        }
        
        // Load saved state
        let modelId = parseInt(localStorage.getItem("modelId"), 10);
        let modelTexturesId = parseInt(localStorage.getItem("modelTexturesId"), 10);
        
        if (isNaN(modelId) || isNaN(modelTexturesId)) modelTexturesId = 0;
        if (isNaN(modelId)) modelId = config.modelId || 0;
        
        this.useCDN = useCDN;
        this.cdnPath = cdnPath || "";
        this.cubism2Path = cubism2Path || "";
        this.cubism5Path = cubism5Path || "";
        this._modelId = modelId;
        this._modelTexturesId = modelTexturesId;
        this.currentModelVersion = 0;
        this.loading = false;
        this.modelJSONCache = {};
        this.models = models;
    }
    
    static async initCheck(config, models = []) {
        const manager = new ModelManager(config, models);
        
        if (manager.useCDN) {
            try {
                const response = await fetch(`${manager.cdnPath}model_list.json`);
                if (response.ok) {
                    manager.modelList = await response.json();
                    if (manager.modelId >= manager.modelList.models.length) {
                        manager.modelId = 0;
                    }
                    
                    const model = manager.modelList.models[manager.modelId];
                    if (Array.isArray(model)) {
                        if (manager.modelTexturesId >= model.length) {
                            manager.modelTexturesId = 0;
                        }
                    } else {
                        const url = `${manager.cdnPath}model/${model}/index.json`;
                        const modelData = await manager.fetchWithCache(url);
                        if (manager.checkModelVersion(modelData) === 2) {
                            const textureCache = await manager.loadTextureCache(model);
                            if (manager.modelTexturesId >= textureCache.length) {
                                manager.modelTexturesId = 0;
                            }
                        }
                    }
                } else {
                    logger.warn("Failed to fetch model list, falling back to local models");
                    manager.useCDN = false;
                }
            } catch (error) {
                logger.warn("CDN not available, falling back to local models:", error.message);
                manager.useCDN = false;
            }
        }
        
        if (!manager.useCDN && models.length > 0) {
            if (manager.modelId >= manager.models.length) manager.modelId = 0;
            if (manager.modelTexturesId >= manager.models[manager.modelId].paths.length) {
                manager.modelTexturesId = 0;
            }
        }
        
        return manager;
    }
    
    set modelId(id) {
        this._modelId = id;
        localStorage.setItem("modelId", id.toString());
    }
    
    get modelId() {
        return this._modelId;
    }
    
    set modelTexturesId(id) {
        this._modelTexturesId = id;
        localStorage.setItem("modelTexturesId", id.toString());
    }
    
    get modelTexturesId() {
        return this._modelTexturesId;
    }
    
    resetCanvas() {
        const canvas = document.getElementById("waifu-canvas");
        if (canvas) {
            canvas.innerHTML = '<canvas id="live2d" width="800" height="800"></canvas>';
        }
    }
    
    async fetchWithCache(url) {
        if (url in this.modelJSONCache) {
            return this.modelJSONCache[url];
        }
        
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                this.modelJSONCache[url] = data;
                return data;
            } else {
                logger.warn(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                this.modelJSONCache[url] = null;
                return null;
            }
        } catch (error) {
            logger.error(`Error fetching ${url}:`, error);
            this.modelJSONCache[url] = null;
            return null;
        }
    }
    
    checkModelVersion(modelData) {
        // FIXED: Add null/undefined check
        if (!modelData || typeof modelData !== 'object') {
            logger.warn("Invalid model data, defaulting to Cubism 2");
            return 2;
        }
        
        return (modelData.Version === 3 || modelData.FileReferences) ? 3 : 2;
    }
    
    async loadLive2D(url, modelData) {
        if (this.loading) {
            logger.warn("Still loading. Abort.");
            return;
        }
        
        this.loading = true;
        
        try {
            const version = this.checkModelVersion(modelData);
            
            if (version === 2) {
                if (!this.cubism2model) {
                    if (!this.cubism2Path) {
                        logger.error("No cubism2Path set, cannot load Cubism 2 Core.");
                        return;
                    }
                    await loadScript(this.cubism2Path);
                    const {default: Cubism2} = await import("./chunk/index.js");
                    this.cubism2model = new Cubism2();
                }
                
                if (this.currentModelVersion === 3) {
                    if (this.cubism5model) this.cubism5model.release();
                    this.resetCanvas();
                }
                
                if (this.currentModelVersion !== 3 && this.cubism2model.gl) {
                    await this.cubism2model.changeModelWithJSON(url, modelData);
                } else {
                    await this.cubism2model.init("live2d", url, modelData);
                }
            } else {
                if (!this.cubism5Path) {
                    logger.error("No cubism5Path set, cannot load Cubism 5 Core.");
                    return;
                }
                await loadScript(this.cubism5Path);
                const {AppDelegate} = await import("./chunk/index2.js");
                this.cubism5model = new AppDelegate();
                
                if (this.currentModelVersion === 2) {
                    if (this.cubism2model) this.cubism2model.destroy();
                    this.resetCanvas();
                }
                
                if (this.currentModelVersion !== 2 && this.cubism5model.subdelegates.at(0)) {
                    this.cubism5model.changeModel(url);
                } else {
                    this.cubism5model.initialize();
                    this.cubism5model.changeModel(url);
                    this.cubism5model.run();
                }
            }
            
            logger.info(`Model ${url} (Cubism version ${version}) loaded`);
            this.currentModelVersion = version;
        } catch (error) {
            logger.error("loadLive2D failed:", error);
        } finally {
            this.loading = false;
        }
    }
    
    async loadTextureCache(modelName) {
        const cache = await this.fetchWithCache(`${this.cdnPath}model/${modelName}/textures.cache`);
        return cache || [];
    }
    
    async loadModel(message) {
        let url, modelData;
        
        if (this.useCDN && this.modelList) {
            let model = this.modelList.models[this.modelId];
            if (Array.isArray(model)) {
                model = model[this.modelTexturesId];
            }
            
            url = `${this.cdnPath}model/${model}/index.json`;
            modelData = await this.fetchWithCache(url);
            
            if (this.checkModelVersion(modelData) === 2) {
                const textureCache = await this.loadTextureCache(model);
                if (textureCache.length > 0) {
                    let texture = textureCache[this.modelTexturesId];
                    if (typeof texture === "string") texture = [texture];
                    modelData.textures = texture;
                }
            }
        } else if (this.models.length > 0) {
            url = this.models[this.modelId].paths[this.modelTexturesId];
            modelData = await this.fetchWithCache(url);
        } else {
            logger.warn("No models available to load");
            return;
        }
        
        if (modelData) {
            await this.loadLive2D(url, modelData);
            if (message) showMessage(message, 4000, 10);
        } else {
            logger.error("Failed to load model data");
        }
    }
    
    async loadRandTexture(successMessage = "", failMessage = "") {
        const {modelId} = this;
        let noChange = false;
        
        if (this.useCDN && this.modelList) {
            const model = this.modelList.models[modelId];
            if (Array.isArray(model)) {
                this.modelTexturesId = randomNext(model.length, this.modelTexturesId);
            } else {
                const url = `${this.cdnPath}model/${model}/index.json`;
                const modelData = await this.fetchWithCache(url);
                if (this.checkModelVersion(modelData) === 2) {
                    const textureCache = await this.loadTextureCache(model);
                    if (textureCache.length <= 1) {
                        noChange = true;
                    } else {
                        this.modelTexturesId = randomNext(textureCache.length, this.modelTexturesId);
                    }
                } else {
                    noChange = true;
                }
            }
        } else if (this.models.length > 0) {
            if (this.models[modelId].paths.length === 1) {
                noChange = true;
            } else {
                this.modelTexturesId = randomNext(this.models[modelId].paths.length, this.modelTexturesId);
            }
        } else {
            noChange = true;
        }
        
        if (noChange) {
            if (failMessage) showMessage(failMessage, 4000, 10);
        } else {
            await this.loadModel(successMessage);
        }
    }
    
    async loadNextModel() {
        this.modelTexturesId = 0;
        
        if (this.useCDN && this.modelList) {
            this.modelId = (this.modelId + 1) % this.modelList.models.length;
            const message = this.modelList.messages ? this.modelList.messages[this.modelId] : "";
            await this.loadModel(message);
        } else if (this.models.length > 0) {
            this.modelId = (this.modelId + 1) % this.models.length;
            await this.loadModel(this.models[this.modelId].message);
        }
    }
}

// Tools class
class Tools {
    constructor(modelManager, config, messages) {
        this.config = config;
        this.modelManager = modelManager;
        this.tools = {
            hitokoto: {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c0 0 0 0 0 0s0 0 0 0s0 0 0 0c0 0 0 0 0 0l.3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z"/></svg>',
                callback: async () => {
                    try {
                        // Use local Vietnamese quotes API instead of Chinese hitokoto
                        const response = await fetch("/api/quote");
                        const data = await response.json();
                        // Display Vietnamese quote directly
                        showMessage(data.hitokoto || data.quote || "Chúc bạn một ngày tốt lành!", 6000, 9);
                        if (data.from) {
                            setTimeout(() => {
                                showMessage(data.from, 3000, 9);
                            }, 6000);
                        }
                    } catch (error) {
                        // Fallback Vietnamese quotes
                        const quotes = [
                            "Hãy sống như ngày mai bạn sẽ chết!",
                            "Thành công là đi từ thất bại này đến thất bại khác mà không mất đi nhiệt huyết.",
                            "Hạnh phúc không phải là đích đến, mà là hành trình.",
                            "Mỗi ngày là một cơ hội mới để thay đổi cuộc sống.",
                            "Học hỏi từ hôm qua, sống cho hôm nay, hy vọng cho ngày mai."
                        ];
                        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                        showMessage(randomQuote, 6000, 9);
                    }
                }
            },
            asteroids: {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M462.3 62.6C407.5 15.9 326 24.3 275.7 76.2L256 96.5l-19.7-20.3C186.1 24.3 104.5 15.9 49.7 62.6c-62.8 53.6-66.1 149.8-9.9 207.9l193.5 199.8c12.5 12.9 32.8 12.9 45.3 0l193.5-199.8c56.3-58.1 53-154.3-9.8-207.9z"/></svg>',
                callback: () => {
                    // Show love messages instead of asteroids game
                    const loveMessages = [
                        "Bạn thật dễ thương! ❤️",
                        "Cảm ơn bạn đã ở đây! 💕",
                        "Hôm nay bạn có vui không? 😊",
                        "Chúc bạn một ngày tuyệt vời! ✨",
                        "Bạn là người tuyệt vời! 🌟",
                        "Cố lên nhé! Fighting! 💪",
                        "Mỉm cười lên nào! 😄"
                    ];
                    const randomMsg = loveMessages[Math.floor(Math.random() * loveMessages.length)];
                    showMessage(randomMsg, 4000, 10);
                }
            },
            "switch-model": {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M320 64A64 64 0 1 0 192 64a64 64 0 1 0 128 0zm-96 96c-35.3 0-64 28.7-64 64l0 48c0 17.7 14.3 32 32 32l1.8 0 11.1 99.5c1.8 16.2 15.5 28.5 31.8 28.5l38.7 0c16.3 0 30-12.3 31.8-28.5L318.2 304l1.8 0c17.7 0 32-14.3 32-32l0-48c0-35.3-28.7-64-64-64l-64 0z"/></svg>',
                callback: () => this.modelManager.loadNextModel()
            },
            "switch-texture": {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M211.8 0c7.8 0 14.3 5.7 16.7 13.2C240.8 51.9 277.1 80 320 80s79.2-28.1 91.5-66.8C413.9 5.7 420.4 0 428.2 0l12.6 0c22.5 0 44.2 7.9 61.5 22.3L628.5 127.4c6.6 5.5 10.7 13.5 11.4 22.1s-2.1 17.1-7.8 23.6l-56 64c-11.4 13.1-31.2 14.6-44.6 3.5L480 197.7 480 448c0 35.3-28.7 64-64 64l-192 0c-35.3 0-64-28.7-64-64l0-250.3-51.5 42.9c-13.3 11.1-33.1 9.6-44.6-3.5l-56-64c-5.7-6.5-8.5-15-7.8-23.6s4.8-16.6 11.4-22.1L137.7 22.3C155 7.9 176.7 0 199.2 0l12.6 0z"/></svg>',
                callback: () => {
                    let successMsg = "";
                    let failMsg = "";
                    if (messages) {
                        successMsg = messages.message.changeSuccess;
                        failMsg = messages.message.changeFail;
                    }
                    this.modelManager.loadRandTexture(successMsg, failMsg);
                }
            },
            photo: {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M220.6 121.2L271.1 96 448 96l0 96-114.8 0c-21.9-15.1-48.5-24-77.2-24s-55.2 8.9-77.2 24L64 192l0-64 128 0c9.9 0 19.7-2.3 28.6-6.8z"/></svg>',
                callback: () => {
                    if (messages) showMessage(messages.message.photo, 6000, 9);
                    const canvas = document.getElementById("live2d");
                    if (!canvas) return;
                    
                    const dataURL = canvas.toDataURL();
                    const link = document.createElement("a");
                    link.style.display = "none";
                    link.href = dataURL;
                    link.download = "live2d-photo.png";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            },
            info: {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/></svg>',
                callback: () => {
                    // Show info about current model instead of opening GitHub
                    const currentModel = this.modelManager.models[this.modelManager.modelId];
                    if (currentModel) {
                        showMessage(`Model: ${currentModel.name}<br>Click Switch Model để thử 27 models khác!`, 6000, 10);
                    } else {
                        showMessage("Live2D Widget v2.0<br>27 models đã được load!", 6000, 10);
                    }
                }
            },
            quit: {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>',
                callback: () => {
                    localStorage.setItem("waifu-display", Date.now().toString());
                    if (messages) showMessage(messages.message.goodbye, 2000, 11);
                    const waifu = document.getElementById("waifu");
                    if (waifu) {
                        waifu.classList.remove("waifu-active");
                        setTimeout(() => {
                            waifu.classList.add("waifu-hidden");
                            const toggle = document.getElementById("waifu-toggle");
                            if (toggle) toggle.classList.add("waifu-toggle-active");
                        }, 3000);
                    }
                }
            }
        };
    }
    
    registerTools() {
        if (!Array.isArray(this.config.tools)) {
            this.config.tools = Object.keys(this.tools);
        }
        
        for (const toolName of this.config.tools) {
            if (this.tools[toolName]) {
                const {icon, callback} = this.tools[toolName];
                const element = document.createElement("span");
                element.id = `waifu-tool-${toolName}`;
                element.innerHTML = icon;
                
                const toolContainer = document.getElementById("waifu-tool");
                if (toolContainer) {
                    toolContainer.insertAdjacentElement("beforeend", element);
                    element.addEventListener("click", callback);
                }
            }
        }
    }
}

// Setup event handlers
function setupEventHandlers(messages) {
    if (!messages) return;
    
    let isActive = false;
    let messageTimer;
    const defaultMessages = messages.message.default;
    let currentSelector;
    
    // Setup seasonal messages
    if (messages.seasons && Array.isArray(messages.seasons)) {
        messages.seasons.forEach(({date, text}) => {
            // FIXED: Type safety check for date
            if (typeof date !== "string") return;
            
            const today = new Date();
            const [startDate, endDate] = date.split("-");
            if (!startDate) return; // Additional safety check
            
            const endDateFinal = endDate || startDate;
            
            // FIXED: Additional type safety checks
            if (typeof startDate === "string" && typeof endDateFinal === "string") {
                const startParts = startDate.split("/");
                const endParts = endDateFinal.split("/");
                
                if (startParts.length >= 2 && endParts.length >= 2) {
                    const startMonth = parseInt(startParts[0], 10);
                    const startDay = parseInt(startParts[1], 10);
                    const endMonth = parseInt(endParts[0], 10);
                    const endDay = parseInt(endParts[1], 10);
                    
                    if (!isNaN(startMonth) && !isNaN(startDay) && !isNaN(endMonth) && !isNaN(endDay)) {
                        const currentMonth = today.getMonth() + 1;
                        const currentDay = today.getDate();
                        
                        if (startMonth <= currentMonth && currentMonth <= endMonth &&
                            startDay <= currentDay && currentDay <= endDay) {
                            const seasonText = randomSelection(text).replace("{year}", String(today.getFullYear()));
                            defaultMessages.push(seasonText);
                        }
                    }
                }
            }
        });
    }
    
    // Mouse activity tracking
    window.addEventListener("mousemove", () => isActive = true);
    window.addEventListener("keydown", () => isActive = true);
    
    setInterval(() => {
        if (isActive) {
            isActive = false;
            clearInterval(messageTimer);
            messageTimer = null;
        } else if (!messageTimer) {
            messageTimer = setInterval(() => {
                showMessage(defaultMessages, 6000, 9);
            }, 20000);
        }
    }, 1000);
    
    // Mouseover events
    if (messages.mouseover && Array.isArray(messages.mouseover)) {
        window.addEventListener("mouseover", (event) => {
            for (const {selector, text} of messages.mouseover) {
                if (event.target && event.target.closest && event.target.closest(selector)) {
                    if (currentSelector === selector) return;
                    currentSelector = selector;
                    let message = randomSelection(text);
                    message = message.replace("{text}", event.target.innerText || "");
                    showMessage(message, 4000, 8);
                    return;
                }
            }
        });
    }
    
    // Click events
    if (messages.click && Array.isArray(messages.click)) {
        window.addEventListener("click", (event) => {
            for (const {selector, text} of messages.click) {
                if (event.target && event.target.closest && event.target.closest(selector)) {
                    let message = randomSelection(text);
                    message = message.replace("{text}", event.target.innerText || "");
                    showMessage(message, 4000, 8);
                    return;
                }
            }
        });
    }
    
    // Live2D specific events
    window.addEventListener("live2d:hoverbody", () => {
        if (messages.message.hoverBody) {
            showMessage(randomSelection(messages.message.hoverBody), 4000, 8, false);
        }
    });
    
    window.addEventListener("live2d:tapbody", () => {
        if (messages.message.tapBody) {
            showMessage(randomSelection(messages.message.tapBody), 4000, 9);
        }
    });
    
    // Console detection
    const noop = () => {};
    console.log("%c", noop);
    noop.toString = () => {
        if (messages.message.console) {
            showMessage(messages.message.console, 6000, 9);
        }
    };
    
    // Other events
    window.addEventListener("copy", () => {
        if (messages.message.copy) {
            showMessage(messages.message.copy, 6000, 9);
        }
    });
    
    window.addEventListener("visibilitychange", () => {
        if (!document.hidden && messages.message.visibilitychange) {
            showMessage(messages.message.visibilitychange, 6000, 9);
        }
    });
}

// Welcome message handler
function getWelcomeMessage(timeMessages, welcomeMessage, referrerMessage) {
    if (location.pathname === "/") {
        for (const {hour, text} of timeMessages) {
            const currentTime = new Date();
            
            // FIXED: Handle both array and string formats for hour
            if (Array.isArray(hour)) {
                if (hour.includes(currentTime.getHours())) {
                    return text;
                }
            } else if (typeof hour === "string" && hour.includes("-")) {
                const [startHour, endHour] = hour.split("-");
                const start = parseInt(startHour, 10);
                const end = parseInt(endHour, 10);
                if (!isNaN(start) && !isNaN(end)) {
                    const currentHour = currentTime.getHours();
                    if (start <= currentHour && currentHour <= end) {
                        return text;
                    }
                }
            }
        }
    }
    
    if (!welcomeMessage) return "";
    
    const formattedWelcome = formatString(welcomeMessage, document.title);
    
    if (!document.referrer || !referrerMessage) return formattedWelcome;
    
    try {
        const referrerUrl = new URL(document.referrer);
        if (location.hostname === referrerUrl.hostname) {
            return formattedWelcome;
        }
        const formattedReferrer = formatString(referrerMessage, referrerUrl.hostname);
        return `${formattedReferrer}<br>${formattedWelcome}`;
    } catch (error) {
        logger.warn("Failed to parse referrer URL:", error);
        return formattedWelcome;
    }
}

// Drag functionality
function enableDragFeature() {
    const waifu = document.getElementById("waifu");
    if (!waifu) return;
    
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    const waifuWidth = waifu.offsetWidth;
    const waifuHeight = waifu.offsetHeight;
    
    waifu.addEventListener("mousedown", (event) => {
        if (event.button === 2) return; // Right click
        
        const live2d = document.getElementById("live2d");
        if (event.target !== live2d) return;
        
        event.preventDefault();
        
        const startX = event.offsetX;
        const startY = event.offsetY;
        
        document.onmousemove = (moveEvent) => {
            const clientX = moveEvent.clientX;
            const clientY = moveEvent.clientY;
            
            let left = clientX - startX;
            let top = clientY - startY;
            
            // Boundary constraints
            if (top < 0) top = 0;
            if (top >= windowHeight - waifuHeight) top = windowHeight - waifuHeight;
            if (left < 0) left = 0;
            if (left >= windowWidth - waifuWidth) left = windowWidth - waifuWidth;
            
            waifu.style.top = top + "px";
            waifu.style.left = left + "px";
        };
        
        document.onmouseup = () => {
            document.onmousemove = null;
        };
    });
    
    window.onresize = () => {
        windowWidth = window.innerWidth;
        windowHeight = window.innerHeight;
    };
}

// Main initialization function
async function initLive2DWidget(config) {
    localStorage.removeItem("waifu-display");
    sessionStorage.removeItem("waifu-message-priority");
    
    // Create widget HTML
    document.body.insertAdjacentHTML("beforeend", `
        <div id="waifu">
            <div id="waifu-tips"></div>
            <div id="waifu-canvas">
                <canvas id="live2d" width="800" height="800"></canvas>
            </div>
            <div id="waifu-tool"></div>
        </div>
    `);
    
    let messages, models = [];
    
    // Load messages and models
    if (config.waifuPath) {
        try {
            const response = await fetch(config.waifuPath);
            if (response.ok) {
                messages = await response.json();
                models = messages.models || [];
            } else {
                logger.error(`Failed to load waifu config: ${response.status}`);
            }
        } catch (error) {
            logger.error("Error loading waifu config:", error);
        }
    }
    
    // Setup event handlers
    if (messages) {
        setupEventHandlers(messages);
        
        // Show welcome message
        const welcomeMsg = getWelcomeMessage(
            messages.time || [],
            messages.message?.welcome,
            messages.message?.referrer
        );
        if (welcomeMsg) {
            showMessage(welcomeMsg, 7000, 11);
        }
    }
    
    // Initialize model manager (use config.models, not messages.models!)
    const modelManager = await ModelManager.initCheck(config, config.models || models);
    await modelManager.loadModel("");
    
    // Register tools
    const tools = new Tools(modelManager, config, messages);
    tools.registerTools();
    
    // Enable drag if configured
    if (config.drag) {
        enableDragFeature();
    }
    
    // Show widget
    const waifu = document.getElementById("waifu");
    if (waifu) waifu.classList.add("waifu-active");
}

// Global initWidget function
window.initWidget = function(config) {
    if (typeof config === "string") {
        logger.error("Your config for Live2D initWidget is outdated. Please refer to https://github.com/stevenjoezhang/live2d-widget/blob/master/dist/autoload.js");
        return;
    }
    
    logger.setLevel(config.logLevel);
    
    // Create toggle button
    document.body.insertAdjacentHTML("beforeend", `
        <div id="waifu-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                <path d="M96 64a64 64 0 1 1 128 0A64 64 0 1 1 96 64zm48 320l0 96c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-192.2L59.1 321c-9.4 15-29.2 19.4-44.1 10S-4.5 301.9 4.9 287l39.9-63.3C69.7 184 113.2 160 160 160s90.3 24 115.2 63.6L315.1 287c9.4 15 4.9 34.7-10 44.1s-34.7 4.9-44.1-10L240 287.8 240 480c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-96-32 0z"/>
            </svg>
        </div>
    `);
    
    const toggle = document.getElementById("waifu-toggle");
    if (toggle) {
        toggle.addEventListener("click", () => {
            toggle.classList.remove("waifu-toggle-active");
            
            if (toggle.getAttribute("first-time")) {
                initLive2DWidget(config);
                toggle.removeAttribute("first-time");
            } else {
                localStorage.removeItem("waifu-display");
                const waifu = document.getElementById("waifu");
                if (waifu) {
                    waifu.classList.remove("waifu-hidden");
                    setTimeout(() => {
                        waifu.classList.add("waifu-active");
                    }, 0);
                }
            }
        });
        
        // Check if should show toggle based on display timeout
        const displayTime = localStorage.getItem("waifu-display");
        if (displayTime && Date.now() - Number(displayTime) <= 86400000) {
            toggle.setAttribute("first-time", "true");
            setTimeout(() => {
                toggle.classList.add("waifu-toggle-active");
            }, 0);
        } else {
            initLive2DWidget(config);
        }
    }
};

export { logger };