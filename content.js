browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "openAdvancedImageViewer") {
            createImageViewer(message.imageUrl);
        } else {
            console.error(`[${browser.i18n.getMessage("extension_title")}]:`, message?.action);
        }
    } catch (err) {
        console.error(`[${browser.i18n.getMessage("extension_title")}]:`, err);
    }
});

function createImageViewer(imageUrl) {
    if (document.getElementById("advanced-image-viewer-extension")) {
        document.getElementById("advanced-image-viewer-extension").remove();
    }
    const svgBasePath = browser.runtime.getURL("res");

    const overlay = document.createElement("div");
    overlay.id = "advanced-image-viewer-extension";
    overlay.innerHTML = `
  <div id="advanced-image-viewer-img-holder">
    <img src="${imageUrl}" id="viewer-image" draggable="false" />
  </div>
  <div id="advanced-image-viewer-controls-holder">
    <div class="control-group">
      <button id="rotate-counter-clockwise-5" title="↺ 5°">
        <img src="${svgBasePath}/rotate_counter_clockwise_5.svg"/>
      </button>
      <button id="rotate-clockwise-5" title="↻ 5°">
        <img src="${svgBasePath}/rotate_clockwise_5.svg"/>
      </button>
      <button id="rotate-counter-clockwise-90" title="↺ 90°">
        <img src="${svgBasePath}/rotate_counter_clockwise_90.svg"/>
      </button>
      <button id="rotate-clockwise-90" title="↻ 90°">
        <img src="${svgBasePath}/rotate_clockwise_90.svg"/>
      </button>
      <button id="clear-rotation" title="${chrome.i18n.getMessage('clear_rotation')}">
        <img src="${svgBasePath}/close.svg"/>
      </button>
    </div>

    <div class="control-group">
      <button id="flip-horizontal" title="${chrome.i18n.getMessage('flip_horizontal')}">
        <img src="${svgBasePath}/flip_horizontal.svg"/>
      </button>
      <button id="flip-vertical" title="${chrome.i18n.getMessage('flip_vertical')}">
        <img src="${svgBasePath}/flip_vertical.svg"/>
      </button>
      <button id="clear-flip" title="${chrome.i18n.getMessage('clear_flip')}">
        <img src="${svgBasePath}/close.svg"/>
      </button>
    </div>

    <div class="control-group">
      <button id="zoom-in" title="${chrome.i18n.getMessage('zoom_in')}">
        <img src="${svgBasePath}/zoom_in.svg"/>
      </button>
      <button id="zoom-out" title="${chrome.i18n.getMessage('zoom_out')}">
        <img src="${svgBasePath}/zoom_out.svg"/>
      </button>
      <button id="clear-zoom" title="${chrome.i18n.getMessage('clear_zoom')}">
        <img src="${svgBasePath}/close.svg"/>
      </button>
    </div>

    <div class="control-group">
      <button id="pan-up" title="${chrome.i18n.getMessage('pan_up')}">
        <img src="${svgBasePath}/pan_up.svg"/>
      </button>
      <button id="pan-down" title="${chrome.i18n.getMessage('pan_down')}">
        <img src="${svgBasePath}/pan_down.svg"/>
      </button>
      <button id="pan-left" title="${chrome.i18n.getMessage('pan_left')}">
        <img src="${svgBasePath}/pan_left.svg"/>
      </button>
      <button id="pan-right" title="${chrome.i18n.getMessage('pan_right')}">
        <img src="${svgBasePath}/pan_right.svg"/>
      </button>
      <button id="clear-pan" title="${chrome.i18n.getMessage('clear_pan')}">
        <img src="${svgBasePath}/close.svg"/>
      </button>
    </div>

    <div class="control-group">
      <button id="reset" title="${chrome.i18n.getMessage('reset')}">
        <img src="${svgBasePath}/close.svg"/>
      </button>
      <button id="close" title="${chrome.i18n.getMessage('close')}">
        <img src="${svgBasePath}/close_red.svg"/>
      </button>
    </div>
  </div>
`;

    document.body.appendChild(overlay);

    const image = document.getElementById("viewer-image");
    const rotateCounterClockwise5 = document.getElementById("rotate-counter-clockwise-5");
    const rotateClockwise5 = document.getElementById("rotate-clockwise-5");
    const rotateCounterClockwise90 = document.getElementById("rotate-counter-clockwise-90");
    const rotateClockwise90 = document.getElementById("rotate-clockwise-90");
    const clearRotation = document.getElementById("clear-rotation");
    const flipHorizontal = document.getElementById("flip-horizontal");
    const flipVertical = document.getElementById("flip-vertical");
    const clearFlip = document.getElementById("clear-flip");
    const zoomIn = document.getElementById("zoom-in");
    const zoomOut = document.getElementById("zoom-out");
    const clearZoom = document.getElementById("clear-zoom");
    const panUp = document.getElementById("pan-up");
    const panDown = document.getElementById("pan-down");
    const panLeft = document.getElementById("pan-left");
    const panRight = document.getElementById("pan-right");
    const clearPan = document.getElementById("clear-pan");
    const reset = document.getElementById("reset");
    const close = document.getElementById("close");

    const elements = {
        image, rotateCounterClockwise5, rotateClockwise5, rotateCounterClockwise90, rotateClockwise90,
        clearRotation, flipHorizontal, flipVertical, clearFlip,
        zoomIn, zoomOut, clearZoom, panUp, panDown, panLeft,
        panRight, clearPan, reset, close
    };
    for (const [key, value] of Object.entries(elements)) {
        if (!value) {
            console.error(`[${browser.i18n.getMessage("extension_title")}]:`, key);
            return;
        }
    }

    // 状态管理
    let state = {
        rotation: 0, // 累计旋转角度（度）
        scaleX: 1, // 水平翻转（1 或 -1）
        scaleY: 1, // 垂直翻转（1 或 -1）
        zoom: 1, // 缩放比例
        translateX: 0, // 水平位移（像素）
        translateY: 0 // 垂直位移（像素）
    };

    const transition = "transform 0.1s";
    let enableAnimation = false;

    // 更新图片变换
    function updateTransform() {
        if (enableAnimation)
        {
            image.style.transition = transition;
        }
        else
        {
            image.style.transition = "none";
        }

        const transform = `
            translate(calc(${state.translateX}px - 50%), calc(${state.translateY}px - 50%))
            rotate(${state.rotation}deg)
            scale(${state.scaleX * state.zoom}, ${state.scaleY * state.zoom})
        `;
        image.style.transform = transform.trim();

        if (state.scaleX === -1)
        {
            flipHorizontal.style.borderColor = "yellow";
        }
        else
        {
            flipHorizontal.style.borderColor = "transparent";
        }

        if (state.scaleY === -1)
        {
            flipVertical.style.borderColor = "yellow";
        }
        else
        {
            flipVertical.style.borderColor = "transparent";
        }
        enableAnimation = false;
    }

    // 鼠标平移状态
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    // 鼠标按下：开始拖动
    image.addEventListener("mousedown", (e) => {
        isDragging = true;
        startX = e.clientX - state.translateX;
        startY = e.clientY - state.translateY;
        image.style.cursor = "grabbing";
    });

    // 鼠标移动：更新位移
    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            state.translateX = e.clientX - startX;
            state.translateY = e.clientY - startY;
            updateTransform();
        }
    });

    // 鼠标松开：停止拖动
    document.addEventListener("mouseup", () => {
        if (isDragging) {
            isDragging = false;
            image.style.cursor = "grab";
        }
    });

    // 鼠标滚轮：缩放
    image.addEventListener("wheel", (e) => {
        e.preventDefault(); // 防止页面滚动
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1; // 向上滚放大，向下滚缩小
        state.zoom *= zoomFactor;
        // 限制缩放范围（可选）
        state.zoom = Math.max(0.1, Math.min(state.zoom, 5)); // 限制缩放范围在 0.1 到 5 之间
        updateTransform();
    });

    overlay.addEventListener("wheel", (e) => {
        e.preventDefault(); // 防止页面滚动
        const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1; // 向上滚放大，向下滚缩小
        state.zoom *= zoomFactor;
        // 限制缩放范围（可选）
        state.zoom = Math.max(0.1, Math.min(state.zoom, 5)); // 限制缩放范围在 0.1 到 5 之间
        updateTransform();
    });


    // 旋转操作
    rotateCounterClockwise5.addEventListener("click", () => {
        state.rotation -= 5;
        useAnimationOnce();
        updateTransform();

    });
    rotateClockwise5.addEventListener("click", () => {
        state.rotation += 5;
        useAnimationOnce();
        updateTransform();

    });
    rotateCounterClockwise90.addEventListener("click", () => {
        state.rotation -= 90;
        useAnimationOnce();
        updateTransform();

    });
    rotateClockwise90.addEventListener("click", () => {
        state.rotation += 90;
        useAnimationOnce();
        updateTransform();
    });
    clearRotation.addEventListener("click", () => {
        state.rotation = 0;
        useAnimationOnce();
        updateTransform();

    });

    // 翻转操作
    flipHorizontal.addEventListener("click", () => {
        state.scaleX *= -1;
        useAnimationOnce();
        updateTransform();

    });
    flipVertical.addEventListener("click", () => {
        state.scaleY *= -1;
        useAnimationOnce();
        updateTransform();

    });
    clearFlip.addEventListener("click", () => {
        state.scaleX = 1;
        state.scaleY = 1;
        useAnimationOnce();
        updateTransform();

    });

    // 缩放操作
    zoomIn.addEventListener("click", () => {
        state.zoom *= 1.1;
        state.zoom = Math.max(0.1, Math.min(state.zoom, 5)); // 限制缩放范围
        updateTransform();
    });
    zoomOut.addEventListener("click", () => {
        state.zoom /= 1.1;
        state.zoom = Math.max(0.1, Math.min(state.zoom, 5)); // 限制缩放范围
        updateTransform();
    });
    clearZoom.addEventListener("click", () => {
        state.zoom = 1;
        updateTransform();
    });

    // 位移操作
    panUp.addEventListener("click", () => {
        state.translateY -= 10;
        updateTransform();
    });
    panDown.addEventListener("click", () => {
        state.translateY += 10;
        updateTransform();
    });
    panLeft.addEventListener("click", () => {
        state.translateX -= 10;
        updateTransform();
    });
    panRight.addEventListener("click", () => {
        state.translateX += 10;
        updateTransform();
    });
    clearPan.addEventListener("click", () => {
        state.translateX = 0;
        state.translateY = 0;
        updateTransform();
    });

    function useAnimationOnce() {
        enableAnimation = true;
    }

    // 重置所有变换
    reset.addEventListener("click", () => {
        state = {
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            zoom: 1,
            translateX: 0,
            translateY: 0
        };
        updateTransform();
    });

    // 关闭浮层
    close.addEventListener("click", () => {
        overlay.remove();
    });
}