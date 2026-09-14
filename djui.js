// DJUI Customization //

// The FPS that DJUI runs at, Default is 30, set to 0 for uncapped
const DJUIJS_FPS = 60

// Sacrifices Accuracy for better mobile support with RESOLUTION_N64
const DJUIJS_SAFE_N64 = false

// Set up canvas for rendering
if (!document.body) {
    document.documentElement.appendChild(document.createElement('body'));
}

const canvas = document.createElement('canvas');
canvas.style.touchAction = "none"; // Don't let the browser eat touches

document.body.appendChild(canvas);

canvas.id = 'myCanvas';
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.imageRendering = 'pixelated'
// canvas.style.width = '100vw';
// canvas.style.height = '100vh';
let dpi = window.devicePixelRatio
let windowWidth = window.innerWidth
let windowHeight = window.innerHeight
canvas.width = windowWidth * dpi;
canvas.height = windowHeight * dpi;
document.body.appendChild(canvas);

let resN64Math = windowHeight / 240;
const ctx = canvas.getContext('2d');

// const buffer = document.createElement('canvas');
// const buf = buffer.getContext('2d');

// The real stuffs

let djuiGlobalTimer = 0
function get_global_timer() {
    return djuiGlobalTimer
}

const RESOLUTION_DJUI = 1;
const RESOLUTION_N64 = 2;
let currentResolution = RESOLUTION_DJUI;
let resDJUIScale = 1; // Scale for DJUI resolution

// configDjuiScale: 0 = auto, 1 = 0.5, 2 = 0.85, 3 = 1.0, 4 = 1.5
let configDjuiScale = 3; // You can set this elsewhere as needed

function djui_gfx_get_scale() {
    if (configDjuiScale == 0) { // auto
        if (windowHeight < 768) {
            return 0.5;
        } else if (windowHeight < 1440) {
            return 1.0;
        } else {
            return 1.5;
        }
    } else {
        switch (configDjuiScale) {
            case 1:  return 0.5;
            case 2:  return 0.85;
            case 3:  return 1.0;
            case 4:  return 1.5;
            default: return 1.0;
        }
    }
}

function get_res_scale() {
    if (currentResolution == RESOLUTION_DJUI) {
        return resDJUIScale;
    }
    else if (currentResolution == RESOLUTION_N64) {
        return resN64Math;
    }
    return 1;
}

function update_canvas_size() {
    dpi = window.devicePixelRatio
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    canvas.width = windowWidth * dpi;
    canvas.height = windowHeight * dpi;
    canvas.style.width = `${windowWidth}px`;
    canvas.style.height = `${windowHeight}px`;
    ctx.scale(dpi, dpi);
    
    // buf.scale(dpi, dpi);

    if (!DJUIJS_SAFE_N64) {
        resN64Math = windowHeight / 240;
    } else {
        resN64Math = Math.min(windowHeight / 240, windowWidth / 320);
    }
    resDJUIScale = djui_gfx_get_scale();
}

let center = false
function djui_hud_set_centered(centered) {
    center = centered
    if (center)
        ctx.translate(windowWidth/2, windowHeight/2)
    else ctx.translate(-windowWidth/2, -windowHeight/2)
}

function djui_hud_set_resolution(res) {
    if (res != RESOLUTION_DJUI && res != RESOLUTION_N64) {
        throw new Error('Invalid resolution: must be RESOLUTION_DJUI or RESOLUTION_N64');
    }
    currentResolution = res;
    djui_update_mouse_scale()
}

function djui_hud_get_resolution() {
    return currentResolution
}

update_canvas_size()

function djui_hud_get_screen_width() {
    if (currentResolution == RESOLUTION_DJUI || !DJUIJS_SAFE_N64) {
        return canvas.width / dpi / get_res_scale();
    } else {
        return canvas.width / dpi / get_res_scale();
    }
}

function djui_hud_get_screen_height() {
    if (currentResolution == RESOLUTION_DJUI) {
        return canvas.height / dpi / resDJUIScale;
    } else if (currentResolution == RESOLUTION_N64) {
        if (!DJUIJS_SAFE_N64) {
            return 240; // N64 height is always 240 pixels
        } else {
            return canvas.height / dpi / get_res_scale()
        }
    }
}

let ar, ag, ab
function djui_hud_set_color(r, g, b, a) {
    a = a / 255;
    ctx.globalAlpha = a;
    ar=r, ag=g, ab=b
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    // buf.fillStyle = `rgb(${r}, ${g}, ${b})`;
}

const renderList = [];

let currentRotation = 0;
let currentPivotX = 0;
let currentPivotY = 0;

function djui_hud_set_rotation(rotation, pivotX, pivotY) {
    currentRotation = (-rotation / 0x10000) * 360;
    currentPivotX = pivotX;
    currentPivotY = pivotY;
}

function apply_rotation_context(ctx, x, y, width, height) {
    const pivotX = x + width * currentPivotX;
    const pivotY = y + height * currentPivotY;
    ctx.translate(pivotX, pivotY);
    ctx.rotate(currentRotation * Math.PI / 180);
    ctx.translate(-pivotX, -pivotY);
}

let MOUSE_BUTTON_1 = (1 << 0)
let MOUSE_BUTTON_2 = (1 << 1)
let MOUSE_BUTTON_3 = (1 << 2)
let MOUSE_BUTTON_4 = (1 << 3)
let MOUSE_BUTTON_5 = (1 << 4)

let L_MOUSE_BUTTON = MOUSE_BUTTON_1
let M_MOUSE_BUTTON = MOUSE_BUTTON_2
let R_MOUSE_BUTTON = MOUSE_BUTTON_3

let _source_mouse_x = 0;
let _source_mouse_y = 0;
let _djui_mouse_x = 0;
let _djui_mouse_y = 0;
let _djui_mouse_buttons_down = 0;
let _djui_mouse_buttons_prev = 0;

// Mouse Listener
function djui_update_mouse_scale(e) {
    _djui_mouse_x = (_source_mouse_x) / get_res_scale();
    _djui_mouse_y = (_source_mouse_y) / get_res_scale();
};


canvas.addEventListener('mousemove', function (e) {
    const rect = canvas.getBoundingClientRect();
    _source_mouse_x = e.clientX - rect.left
    _source_mouse_y = e.clientY - rect.top
    djui_update_mouse_scale(e)
});

canvas.addEventListener('mousedown', function (e) {
    _djui_mouse_buttons_down |= (1 << e.button);
});

canvas.addEventListener('mouseup', function (e) {
    _djui_mouse_buttons_down &= ~(1 << e.button);
});
window.addEventListener('mouseout', (e) => {
    _djui_mouse_buttons_down &= ~(1 << e.button);
});

// Mobile "Mouse" Support
function update_touch_pos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0] || e.changedTouches[0];

    if (touch) {
        _source_mouse_x = touch.clientX - rect.left;
        _source_mouse_y = touch.clientY - rect.top;
    }

    e.preventDefault();
    djui_update_mouse_scale(e);
}

canvas.addEventListener('touchstart', function (e) {
    update_touch_pos(e);
    _djui_mouse_buttons_down |= (1 << 0);
}, { passive: false });


canvas.addEventListener('touchmove', function (e) {
    update_touch_pos(e);
}, { passive: false });

canvas.addEventListener('touchend', function (e) {
    update_touch_pos(e);
    _djui_mouse_buttons_down &= ~(1 << 0);
}, { passive: false });

canvas.addEventListener('touchcancel', function (e) {
    _djui_mouse_buttons_down &= ~(1 << 0);
}, { passive: false });


function djui_hud_get_mouse_x() {
    return _djui_mouse_x - (center ? djui_hud_get_screen_width()/2 : 0);
}

function djui_hud_get_mouse_y() {
    return _djui_mouse_y - (center ? djui_hud_get_screen_height()/2 : 0);
}

function djui_hud_get_mouse_buttons_down() {
    return _djui_mouse_buttons_down;
}

function djui_hud_get_mouse_buttons_pressed() {
    return (_djui_mouse_buttons_down & ~_djui_mouse_buttons_prev);
}

function djui_hud_get_mouse_buttons_released() {
    return (~_djui_mouse_buttons_down & _djui_mouse_buttons_prev);
}

function djui_hud_render_rect(x, y, width, height) {
    const scale = get_res_scale();
    const sx = x * scale;
    const sy = y * scale;
    const sw = width * scale;
    const sh = height * scale;
    ctx.save();
    apply_rotation_context(ctx, sx, sy, sw, sh);
    ctx.fillRect(sx, sy, sw, sh);
    ctx.restore();
}

const fontStyles = document.createElement('style');
const FONT_NORMAL = 1;
const FONT_ALIASED = 2;
fontStyles.textContent = `
@font-face {font-family: FONT_NORMAL; src: url('./djui-js/sm64coopdx-normal.ttf') format('truetype'); font-weight: normal; font-style: normal;}
@font-face {font-family: FONT_ALIASED; src: url('./djui-js/sm64coopdx-aliased.ttf') format('truetype'); font-weight: normal; font-style: normal;}
`;
document.head.appendChild(fontStyles);

ctx.font = '24px FONT_NORMAL';
currentFont = 'FONT_NORMAL'
currentFontSize = 32;
function djui_hud_set_font(font) {
    if (font == FONT_NORMAL) {
        currentFont = 'FONT_NORMAL';
        currentFontSize = 32;
    } else if (font == FONT_ALIASED) {
        currentFont = 'FONT_ALIASED';
        currentFontSize = 16;
    }
}
function djui_hud_measure_text(text) {
    const scale = get_res_scale();
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = `${currentFontSize * scale}px ${currentFont}`;
    const metrics = ctx.measureText(text);
    ctx.restore();
    return metrics.width / scale;
}

function djui_hud_print_text(text, x, y, scale) {
    const resScale = get_res_scale();
    ctx.textBaseline = 'top'; // Align text at the top
    ctx.imageSmoothingEnabled = false;
    ctx.font = `${scale * currentFontSize * resScale}px ${currentFont}`;
    ctx.fillText(text, x * resScale, y * resScale);
}

function get_texture_info(texName) {
    const img = new Image();
    img.src = `./textures/${texName}.png`
    return img;
}

function djui_hud_render_texture(texture, x, y, scaleX, scaleY) {
    if (!(texture instanceof HTMLImageElement) || !texture.complete || texture.width == 0) {
        return;
    }

    const scale = get_res_scale();
    const drawX = x * scale;
    const drawY = y * scale;
    const drawW = texture.width * scaleX * scale;
    const drawH = texture.height * scaleY * scale;

    // works well only at full alpha
    const alpha = ctx.globalAlpha
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    apply_rotation_context(ctx, drawX, drawY, drawW, drawH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(texture, drawX, drawY, drawW, drawH);
    ctx.globalCompositeOperation = "destination-over";
    // ctx.globalAlpha = 1
    // ctx.fillStyle = `rgb(${ar*alpha*alpha*alpha*alpha*alpha*alpha}, ${ag*alpha*alpha*alpha*alpha*alpha*alpha}, ${ab*alpha*alpha*alpha*alpha*alpha*alpha})`;
    ctx.fillRect(drawX, drawY, drawW, drawH);
    ctx.globalCompositeOperation = "multiply";
    // ctx.globalAlpha = alpha
    ctx.drawImage(texture, drawX, drawY, drawW, drawH);
    ctx.restore();

    // true but really expensive methods below
    // buf.save();
    // if (texture.width > buffer.width) buffer.width = texture.width
    // if (texture.height > buffer.height) buffer.height = texture.height
    // // buf.clearRect(0, 0, buffer.width, buffer.height)
    // buf.imageSmoothingEnabled = false;
    // buf.globalCompositeOperation = "source-over";
    // buf.fillStyle = ctx.fillStyle
    // buf.fillRect(0, 0, texture.width, texture.height);
    // buf.globalCompositeOperation = "destination-in";
    // buf.drawImage(texture, 0, 0);
    // buf.globalCompositeOperation = "multiply";
    // buf.drawImage(texture, 0, 0);
    // ctx.save();
    // apply_rotation_context(ctx, drawX, drawY, drawW, drawH);
    // ctx.imageSmoothingEnabled = false;
    // ctx.drawImage(buffer, drawX, drawY);
    // buf.restore()
    // ctx.resetTransform()


    // // buf.save();
    // buffer.width = texture.width
    // buffer.height = texture.height
    // // buf.clearRect(0, 0, buffer.width, buffer.height)
    // buf.imageSmoothingEnabled = false;
    // buf.globalCompositeOperation = "source-over";
    // buf.fillStyle = ctx.fillStyle
    // buf.fillRect(0, 0, buffer.width, buffer.height);
    // buf.globalCompositeOperation = "destination-in";
    // buf.drawImage(texture, 0, 0);
    // buf.globalCompositeOperation = "multiply";
    // buf.drawImage(texture, 0, 0);
    // // ctx.save();
    // apply_rotation_context(ctx, drawX, drawY, drawW, drawH);
    // ctx.drawImage(buffer, drawX, drawY, drawW, drawH);
    // // buf.restore()
    // // ctx.restore();
    // ctx.resetTransform()
    // // ctx.restore();
}

function djui_hud_render_texture_tile(texture, x, y, scaleX, scaleY, tileX, tileY, tileWidth, tileHeight) {
    if (!(texture instanceof HTMLImageElement) || !texture.complete || texture.naturalWidth == 0) {
        return;
    }

    const scale = get_res_scale();
    const drawX = x * scale;
    const drawY = y * scale;
    const drawW = tileWidth * scaleX * scale;
    const drawH = tileHeight * scaleY * scale;

    ctx.save();
    apply_rotation_context(ctx, drawX, drawY, drawW, drawH);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
        texture,
        tileX, tileY, tileWidth, tileHeight, // source crop rectangle
        drawX, drawY, drawW, drawH           // destination on canvas
    );
    ctx.restore();
}

// DJUI Popups
let DjuiPopup = []
let sPopupListY = 4
const DJUI_POPUP_LIFETIME = 180

function djui_hud_popup_create(message, lines) {
    // Log just in case
    console.log(message)

    let height = lines * 32 + 32
    let split = message.split("\n")
    DjuiPopup.push({
        text: split,
        lines: lines,
        createTime: get_global_timer(),
        height: height,
        x: 8,
        y: -height,
        alpha: 1.0,
    })

    sPopupListY -= height + 4
    // play_sound(SOUND_MENU_PINCH_MARIO_FACE, gGlobalSoundSource);
}

function djui_popup_update() {
    let y = sPopupListY + 4
    let screenWidth = djui_hud_get_screen_width()

    for (let i = (DjuiPopup.length - 1); i >= 0; ) {
        let node = DjuiPopup[i]
        if (node == null) {
            i--
            continue
        }
        node.y = y
        y += node.height + 14

        let elapsed = get_global_timer() - node.createTime

        // fade out
        let alpha = Math.min(Math.max((DJUI_POPUP_LIFETIME - elapsed)/30, 0), 1)
        alpha *= alpha
        if (elapsed > DJUI_POPUP_LIFETIME) alpha = 0

        // Render Border (Thanks DJUI)
        djui_hud_set_color(0, 0, 0, 180 * alpha)
        djui_hud_render_rect(screenWidth - 404 - node.x, node.y, 4, node.height)
        djui_hud_render_rect(screenWidth - node.x, node.y, 4, node.height)
        djui_hud_render_rect(screenWidth - 404 - node.x, node.y - 4, 408, 4)
        djui_hud_render_rect(screenWidth - 404 - node.x, node.y + node.height, 408, 4)
        // Render BG
        djui_hud_set_color(0, 0, 0, 220 * alpha)
        djui_hud_render_rect(screenWidth - 400 - node.x, node.y, 400, node.height)
        // Render Text
        djui_hud_set_font(FONT_NORMAL);
        djui_hud_set_color(255, 255, 255, 255 * alpha)
        for (let text of node.text) {
            let height = node.height*0.5 - (node.text.length)*15 + node.text.indexOf(text)*30
            djui_hud_print_text(text, screenWidth - 200 - djui_hud_measure_text(text)*0.5 - node.x, node.y + height, 1)
        }
        
        // remove popup if fully faded
        if (alpha == 0) {
            DjuiPopup.splice(i, 1)
            continue
        }

        i--
    }

    // move entire popup list toward 4
    sPopupListY = sPopupListY * 0.75 + 1
    if (sPopupListY > 8) sPopupListY = 8
}

const hookedFunctions = [];
function hook_event(func) {
    if (typeof func == 'function') {
        hookedFunctions.push(func);
    }
}

let lastError = ""
let lastErrorTimer = 0
function djui_on_render() {
    renderList.length = 0;
    update_canvas_size()

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const fn of hookedFunctions) {
        try {
            fn();
        } catch (error) {
            fn._errored = true;
            lastErrorTimer = 150;
            // Only log the useful part
            console.error(`${error.message} (${error.fileName || "unknown file"}:${error.lineNumber || "?"})`);
        }
    }
    
    djui_hud_set_resolution(RESOLUTION_DJUI);

    if (lastErrorTimer > 0) {
        djui_hud_set_font(FONT_NORMAL);
        djui_hud_set_rotation(0, 0, 0);

        const error = `'${document.title}' has script errors!`
        djui_hud_set_color(0, 0, 0, 255);
        djui_hud_print_text(error, djui_hud_get_screen_width() * 0.5 - djui_hud_measure_text(error) * 0.5 + 1, 31, 1);
        djui_hud_set_color(255, 0, 0, 255);
        djui_hud_print_text(error, djui_hud_get_screen_width() * 0.5 - djui_hud_measure_text(error) * 0.5, 30, 1);

        lastErrorTimer = lastErrorTimer - 1
    }
    _djui_mouse_buttons_prev = _djui_mouse_buttons_down;

    djui_popup_update()

    djuiGlobalTimer++
}
setInterval(djui_on_render, 1000/DJUIJS_FPS)