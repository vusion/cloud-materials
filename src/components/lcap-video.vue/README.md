<!-- 该 README.md 根据 api.yaml 和 docs/*.md 自动生成，为了方便在 GitHub 和 NPM 上查阅。如需修改，请查看源文件 -->

# LcapVideo 视频

- [示例](#示例)
    - [基本用法](#基本用法)
- [API]()
    - [Props/Attrs](#propsattrs)
    - [Events](#events)
    - [Methods](#methods)

**Media**

基于 video.js 的视频播放组件

## 示例
### 基本用法

``` vue
<template>
  <lcap-video :src="src" width="500" @start="onStart" @play="onPlay"></lcap-video>
</template>

<script>
export default {
    data() {
        return {
            src: 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4',
        }
    },
    methods: {
        onStart() {
            console.log('播放开始时');
        },
        onPlay() {
            console.log('继续播放时');
        },
    },
}
</script>
```

## API
### Props/Attrs

| Prop/Attr | Type | Options | Default | Description |
| --------- | ---- | ------- | ------- | ----------- |
| src | string |  |  | 视频流地址 |
| autoplay | boolean |  | `false` | 是否自动播放 |
| draggable | boolean |  | `true` | 是否可拖放 |
| loop | boolean |  | `false` | 是否循环播放 |

### Events

#### @start



| Param | Type | Description |
| ----- | ---- | ----------- |
| $event | object | 播放器实例对象 |

#### @pause



| Param | Type | Description |
| ----- | ---- | ----------- |
| $event | object | 播放器实例对象 |

#### @play



| Param | Type | Description |
| ----- | ---- | ----------- |
| $event | object | 播放器实例对象 |

#### @ended



| Param | Type | Description |
| ----- | ---- | ----------- |
| $event | object | 播放器实例对象 |

Methods

#### play()

继续播放

| Param | Type | Default | Description |
| ----- | ---- | ------- | ----------- |

#### pause()

暂停播放

| Param | Type | Default | Description |
| ----- | ---- | ------- | ----------- |

