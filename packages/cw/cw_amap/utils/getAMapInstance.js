import AMapLoader from '@amap/amap-jsapi-loader';

let fetcherPromise = null;
const APP_SECRET_KEY = 'APP_SECERT_KEY';
const APP_KEY = 'APP_KEY';

const LIBRARY_NAME = 'cw_amap';
const IS_DEV = !!process.vusionDevEnv;
function getBasePath() {
    return window.appInfo && window.appInfo.basePath ? window.appInfo.basePath : "";
}
const getAMapInstanceImpl = async () => {
    const [appSecret, appKey] = await Promise.all(
        [
            !IS_DEV &&
                fetch(
                    `${getBasePath()}/api/system/getCustomConfig/${APP_SECRET_KEY}?group=extensions.${LIBRARY_NAME}.custom`
                ).then((r) => r.text()),
            !IS_DEV &&
                fetch(
                    `${getBasePath()}/api/system/getCustomConfig/${APP_KEY}?group=extensions.${LIBRARY_NAME}.custom`
                ).then((r) => r.text()),
            IS_DEV && Promise.resolve(process.vusionDevEnv.APP_SECRET_KEY),
            IS_DEV && Promise.resolve(process.vusionDevEnv.APP_KEY),
        ].filter(Boolean)
    );

    if (!appKey || !appSecret) {
        throw new Error('请配置高德地图参数');
    }
    window._AMapSecurityConfig = {
        securityJsCode: appSecret,
    };
    try {
        const amap = await AMapLoader.load({
            key: appKey, //申请好的 Web 端开发者 Key，首次调用 load 时必填
            version: '2.0', //指定要加载的 JS API 的版本，缺省时默认为 1.4.15
            plugins: [
                'AMap.Scale',
                'AMap.MoveAnimation',
                'AMap.MarkerCluster',
                'AMap.ControlBar',
                'AMap.ToolBar',
            ], //需要使用的的插件列表，如比例尺'AMap.Scale'，支持添加多个如：['AMap.Scale','...','...']
            // AMapUI: {
            //     //是否加载 AMapUI，缺省不加载
            //     version: '1.1', //AMapUI 版本
            //     // plugins: ["overlay/SimpleMarker"], //需要加载的 AMapUI ui 插件
            // },
            AMapUI: {
                version: '1.1',
                plugins: ['misc/PoiPicker'],
            },
            Loca: {
                // 是否加载 Loca， 缺省不加载
                version: '2.0.0', // Loca 版本，缺省 1.3.2
            },
        });

        return amap;
    } catch (e) {
        throw new Error('高德地图参数错误');
    }
};

// 同步多次调用仅仅请求一次（最开始的一次），无视force的值。
// 异步多次调用时且force为true的情况下，尝试获取新的值。

export const getAMapInstance = (force = false) => {
    if (fetcherPromise) {
        if (fetcherPromise.batchFlag) return fetcherPromise;
        if (!force) return fetcherPromise;
    }
    const promise = getAMapInstanceImpl();
    fetcherPromise = promise;
    fetcherPromise.batchFlag = true;
    Promise.resolve(() => {
        fetcherPromise.batchFlag = false;
    });
    return promise;
};
