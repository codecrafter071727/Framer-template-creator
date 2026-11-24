import{t as e}from"./rolldown-runtime.Bi-D_2cA.mjs";import{F as t,M as n,T as r,j as i,l as a,o,p as s,s as c,w as l,x as u}from"./react.BgZEIVeh.mjs";import{O as d,c as f,n as p,o as m,r as h}from"./motion.BdFrYdDp.mjs";import{A as g,At as _,C as v,D as y,Dt as b,E as ee,F as x,Ft as S,H as C,M as w,N as te,Ot as T,P as E,T as D,Tt as O,U as k,V as A,Y as j,at as ne,f as re,ft as ie,g as M,i as N,k as P,o as F,w as ae,yt as I}from"./framer.BMJwZ2MI.mjs";import{S as L,x as oe}from"./toplevel-deps.BXlpsaA0.mjs";var R;function z(){return(z=e((()=>{j(),R=te({title:`Liquid Gradient`,resolutionScale:`consistent`,mouse:`disabledByDefault`,buffers:[{name:`push`,resolutionScale:.5,format:`rgba16f`,fragment:`
void main() {
    float aspect = u_resolution.x / u_resolution.y;
    vec2 aspectFix = vec2(aspect, 1.0);

    vec2 texel = 1.0 / u_resolution;

    // --- Read own previous frame + neighbours ---
    vec4 prev = texture(u_push_buffer, v_uv);
    vec2 c  = prev.xy;
    vec2 nl = texture(u_push_buffer, v_uv - vec2(texel.x, 0.0)).xy;
    vec2 nr = texture(u_push_buffer, v_uv + vec2(texel.x, 0.0)).xy;
    vec2 nd = texture(u_push_buffer, v_uv - vec2(0.0, texel.y)).xy;
    vec2 nu = texture(u_push_buffer, v_uv + vec2(0.0, texel.y)).xy;

    vec2 blurred = (nl + nr + nd + nu) * 0.25;
    vec2 field = mix(c, blurred, 0.12);

    float r = clamp(u_deltaTime * 60.0, 0.0, 3.0);
    float decay = pow(mix(0.86, 0.985, clamp(u_mousePersist, 0.0, 1.0)), r);
    field *= decay;

    // --- Smooth the cursor velocity (EMA) ---
    // Raw .zw arrives in uneven per-frame pulses at low speeds; the EMA
    // spreads each pulse over a few frames so the deposit reads as a
    // continuous stream. ~0.25 blend per 60fps frame, frame-rate independent.
    vec2 rawVel = u_mousePosition.zw * aspectFix * u_mouseHover;
    float smoothK = 1.0 - pow(0.75, r); //or smoothK = 1. for original no smooth feeling
    vec2 mouseVel = mix(prev.zw, rawVel, smoothK);

    float speed    = length(mouseVel);
    float brush    = max(u_mouseRadius * 0.1, 0.001);

    float speedPerSec = speed / max(u_deltaTime, 1e-4);
    float moving      = 1.0 - exp(-speedPerSec * 0.5);

    vec2 dir       = speed > 1e-5 ? mouseVel / speed : vec2(1.0, 0.0);
    vec2 ortho     = vec2(-dir.y, dir.x);

    vec2 toMouse   = (v_uv - u_mousePosition.xy) * aspectFix;
    //toMouse       += dir * brush * 0.2 * moving;

    float along    = dot(toMouse, dir);
    float across   = dot(toMouse, ortho);
    float ra       = brush * (1.0 + u_mouseStretch * moving);
    float rb       = brush;
    float d2       = (along * along) / (ra * ra) + (across * across) / (rb * rb);
    float falloff  = exp(-d2);

    field += mouseVel * falloff * (u_mousePush * 0.1) * u_mouseHover;

    field = clamp(field, -1.0, 1.0);

    fragColor = vec4(field, mouseVel);
}
`}],fragment:`
// === CONSTANTS ===
const float GOLDEN_ANGLE = 2.3999632;
const float TAU = 6.28318530;

// === PCG hash - https://www.jcgt.org/published/0009/03/02/
uvec3 hash3(uvec3 v) {
    v = v * 1664525u + 1013904223u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    v ^= v >> 16u;
    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;
    return v;
}

// Seed
vec3 seedRandom(float seedVal) {
    uvec3 s = uvec3(
        floatBitsToUint(seedVal),
        floatBitsToUint(seedVal * 1.5 + 7.31),
        floatBitsToUint(seedVal * 2.7 + 13.37)
    );
    s = hash3(s);
    return vec3(s) / float(0xFFFFFFFFu);
}

// === COLOR SPACE UTILITIES ===
vec3 toLinear(vec3 c) {
    return pow(c, vec3(2.2));
}

vec3 toSrgb(vec3 c) {
    return pow(clamp(c, 0.0, 1.0), vec3(0.4545));
}

vec3 linearToOklab(vec3 c) {
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
    
    l = pow(max(l, 0.0), 1.0/3.0);
    m = pow(max(m, 0.0), 1.0/3.0);
    s = pow(max(s, 0.0), 1.0/3.0);
    
    return vec3(
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    );
}

vec3 oklabToLinear(vec3 c) {
    float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
    float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
    float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
    
    l = l * l * l;
    m = m * m * m;
    s = s * s * s;
    
    return vec3(
        +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    );
}

vec3 oklabToLch(vec3 lab) {
    return vec3(lab.x, length(lab.yz), atan(lab.z, lab.y));
}

vec3 lchToOklab(vec3 lch) {
    return vec3(lch.x, lch.y * cos(lch.z), lch.y * sin(lch.z));
}

vec3 mixLch(vec3 lab0, vec3 lab1, float t) {
    vec3 lch0 = oklabToLch(lab0);
    vec3 lch1 = oklabToLch(lab1);
    
    if (lch0.y < 0.05) lch0.z = lch1.z;
    if (lch1.y < 0.05) lch1.z = lch0.z;
    
    float dh = lch1.z - lch0.z;
    if (dh > 3.14159265) dh -= 6.28318530;
    if (dh < -3.14159265) dh += 6.28318530;
    
    return lchToOklab(vec3(
        mix(lch0.x, lch1.x, t),
        mix(lch0.y, lch1.y, t),
        lch0.z + dh * t
    ));
}

// === PALETTE SAMPLING ===
vec3 getColor(int idx) {
    if (u_colors_length < 1) return vec3(0.0);
    int safeIdx = clamp(idx, 0, u_colors_length - 1);
    return u_colors[safeIdx].rgb;
}

vec3 paletteN(float t, int count) {
    if (count < 1) return vec3(0.0);
    if (count < 2) return toLinear(getColor(0));
    
    float segmentSize = 1.0 / float(count - 1);
    t = clamp(t, 0.0, 1.0);
    int idx = min(int(floor(t / segmentSize)), count - 2);
    float localT = clamp((t - float(idx) * segmentSize) / segmentSize, 0.0, 1.0);
    
    vec3 lab0 = linearToOklab(toLinear(getColor(idx)));
    vec3 lab1 = linearToOklab(toLinear(getColor(idx + 1)));
    
    return oklabToLinear(mixLch(lab0, lab1, localT));
}

// === DITHER ===
float IGN(vec2 uv) {
    return fract(52.9829189 * fract(dot(uv, vec2(0.06711056, 0.00583715))));
}

float quickNoise(vec2 I) {
    return fract(sin(dot(I, vec2(12.9898, 78.233))) * 43758.5453);
}

// Dither Mode: 0=Off, 1=IGN, 2=quickNoise
float getDither(vec2 I, float mode) {
    if (mode < 0.5) return 0.5;          // 0: Off
    if (mode < 1.5) return IGN(I);       // 1: Smooth
    return quickNoise(I);                // 2: Grain
}

// === POST-PROCESS ===
vec3 softGamutMap(vec3 linearRgb) {
    float maxC = max(linearRgb.r, max(linearRgb.g, linearRgb.b));
    float minC = min(linearRgb.r, min(linearRgb.g, linearRgb.b));
    
    if (minC >= 0.0 && maxC <= 1.0) return linearRgb;
    
    vec3 lab = linearToOklab(max(linearRgb, 0.0));
    float L = clamp(lab.x, 0.0, 1.0);
    float C = length(lab.yz);
    float h = atan(lab.z, lab.y);
    
    float maxChroma = 0.4 * (1.0 - pow(abs(2.0 * L - 1.0), 2.0));
    
    if (C > maxChroma * 0.7) {
        float knee = maxChroma * 0.7;
        C = knee + (maxChroma - knee) * tanh(min((C - knee) / (maxChroma - knee + 0.001), 10.0));
    }
    
    return clamp(oklabToLinear(vec3(L, C * cos(h), C * sin(h))), 0.0, 1.0);
}

vec3 applyContrastSaturation(vec3 linearRgb, float contrast, float saturation) {
    vec3 lab = linearToOklab(linearRgb);
    float C = length(lab.yz);
    float h = atan(lab.z, lab.y);
    
    lab.x = clamp((lab.x - 0.5) * contrast + 0.5, 0.0, 1.0);
    C *= saturation;
    lab.y = C * cos(h);
    lab.z = C * sin(h);
    
    return oklabToLinear(lab);
}

// === MAIN ===
void main() {
    vec2 fragCoord = v_uv * u_resolution;
    vec2 r = u_resolution;
    vec2 p = (fragCoord * 2.0 - r) / r.y;
    
    int colorCount = u_colors_length;
    
    // Early out: no colors -> black
    if (colorCount < 1) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    float t = u_time * 0.3;
    
    // Map time onto a circle so animation seamlessly wraps.
    float looping = step(0.5, u_loop);
    float phase = TAU * u_time / max(u_loop, 0.01);
    float radius = u_loop * u_speed * 0.3 / TAU;
    float tA = sin(phase) * radius;
    float tB = (1.0 - cos(phase)) * radius;
    
    // Seed-based offsets
    vec3 seedOffset = seedRandom(u_seed);
    vec3 seedOffset2 = seedRandom(u_seed + 100.0);
    
    // Golden angle rotation
    float seedAngle = u_seed * GOLDEN_ANGLE;
    vec2 seedPhase = (seedOffset2.xy - 0.5) * TAU;
    
    // Seed-based rotation
    float cs = cos(seedAngle);
    float sn = sin(seedAngle);
    mat2 rot = mat2(cs, -sn, sn, cs);
    p = rot * p;

    // === MOUSE PUSH ===
    // Displace the domain by the accumulated push field so the pattern
    // drags in the direction the cursor moved, then relaxes as it decays.
    vec2 pushField = texture(u_push_buffer, v_uv).xy;
    p -= rot * pushField * 2.0;
    
    // Get dither value
    float dither = getDither(floor(fragCoord / u_pixelRatio), u_ditherMode);
    
    // === TURBULENCE ===
    float totalVal = 0.0;
    float totalWeight = 0.0;
    int turbIter = int(u_turbIter);
    
    float freq = 1.0 / max(u_turbFreq, 0.01);
    
    for (float i = 0.0; i < 4.0; i++) {
        float eph = i / 4.0;
       
        vec2 q = p * u_scale;
        float sq = eph * eph;
        
        if (u_jellify > 0.5) {
            q.yx *= mix(1.0, 0.5, 1.0 - exp(-sq));
        }
        
        float a = seedPhase.x;
        float d = seedPhase.y;
        
        for (int j = 2; j < 13; j++) {
            if (j >= turbIter) break;
            float fj = float(j);
            // When looping, use circular time. Otherwise original t.
            float t1 = mix(t * u_speed, tA, looping);
            float t2 = mix(t * u_speed, tB, looping);
            q += u_turbAmp * sin(q.yx / freq * fj + t1 + vec2(a, d) + seedOffset.xy * fj) / fj;
            a += cos(fj + d * 1.2 + q.x * 2.0 - t1 + seedOffset2.z + t2 * 0.3 * looping);
            d += sin(fj * q.y + a + seedOffset.z + t1 + seedOffset2.y + t2 * 0.3 * looping);
        }
        
        float v = 0.5 + 0.5 * sin(length(q.yx + vec2(a, d) * 0.2) * u_waveFreq + i * i + seedOffset.x);
        float weight = smoothstep(0.0, 0.5, eph) * smoothstep(1.0, 0.5, eph);
        totalVal += v * weight;
        totalWeight += weight;
    }
    
    float val = totalVal / totalWeight;
    val = clamp((val - 0.3) / 0.4, 0.0, 1.0);
    val = pow(val, exp(-u_distBias));
    val = clamp(val + (dither - 0.5) * u_dither, 0.0, 1.0);
    
    vec3 col = paletteN(val, colorCount);
    col *= u_exposure;
    col = applyContrastSaturation(col, u_contrast, u_saturation);
    col = softGamutMap(col);
    col = toSrgb(col);
    
    fragColor = vec4(col, 1.0);
}
`,propertyControls:{colors:{type:F.Array,title:`Colors`,control:{type:F.Color},maxCount:8,defaultValue:[`#00001A`,`#2962FF`,`#40BCFF`,`#FFB8B5`,`#FFC14F`]},seed:{type:F.Number,title:`Seed`,defaultValue:648,min:0,max:1e3,step:1},speed:{type:F.Number,title:`Speed`,defaultValue:.3,min:0,max:2,step:.01},loop:{type:F.Number,title:`Loop`,defaultValue:0,min:0,max:60,step:.5,hiddenWhenUnset:!0,displayStepper:!0},scale:{type:F.Number,title:`Scale`,defaultValue:.42,min:.1,max:2,step:.01},turbAmp:{type:F.Number,title:`Amplitude`,defaultValue:.6,min:0,max:1,step:.01},turbFreq:{type:F.Number,title:`Frequency`,defaultValue:.1,min:.1,max:2,step:.01},turbIter:{type:F.Number,title:`Definition`,defaultValue:7,min:3,max:10,step:1,displayStepper:!0},waveFreq:{type:F.Number,title:`Bands`,defaultValue:3.8,min:.1,max:5,step:.1},distBias:{type:F.Number,title:`Bias`,defaultValue:0,min:-1,max:1,step:.1,hiddenWhenUnset:!0},jellify:{type:F.Boolean,title:`Jellify`,defaultValue:!1,hiddenWhenUnset:!0},mousePush:{type:F.Number,title:`Push`,defaultValue:.5,min:.1,max:1,step:.1,section:`Mouse`},mouseRadius:{type:F.Number,title:`Radius`,defaultValue:1,min:.1,max:1,step:.1,section:`Mouse`},mouseStretch:{type:F.Number,title:`Stretch`,defaultValue:0,min:0,max:1,step:.1,section:`Mouse`},mousePersist:{type:F.Number,title:`Persistence`,defaultValue:.8,min:0,max:1,step:.01,section:`Mouse`},ditherMode:{type:F.Enum,title:`Noise`,options:[0,1,2],optionTitles:[`Off`,`Smooth`,`Grain`],defaultValue:0},dither:{type:F.Number,title:`Amount`,defaultValue:.05,min:0,max:.2,step:.01,hidden:e=>e.ditherMode===0},exposure:{type:F.Number,title:`Exposure`,defaultValue:1.1,min:.5,max:2,step:.1,section:`Filters`,displayStepper:!0,hiddenWhenUnset:!0},contrast:{type:F.Number,title:`Contrast`,defaultValue:1.1,min:.5,max:2,step:.1,section:`Filters`,displayStepper:!0,hiddenWhenUnset:!0},saturation:{type:F.Number,title:`Saturation`,defaultValue:1,min:0,max:2,step:.1,section:`Filters`,displayStepper:!0,hiddenWhenUnset:!0}}})})))()}function se(e,...t){let n={};return t?.forEach(t=>t&&Object.assign(n,e[t])),n}var ce,le,ue,de,fe,pe,me,he,ge,B;function _e(){return(_e=e((()=>{c(),j(),h(),r(),ce=[`Trcb_EjRg`,`KJ5oTeQ79`],le=`framer-MHPoo`,ue={KJ5oTeQ79:`framer-v-1ectayn`,Trcb_EjRg:`framer-v-1dgoe84`},de={delay:0,duration:.4,ease:[.44,0,.56,1],type:`tween`},fe=({value:e,children:t})=>{let r=i(f),a=e??r.transition,s=n(()=>({...r,transition:a}),[JSON.stringify(a)]);return/*#__PURE__*/ o(f.Provider,{value:s,children:t})},pe={"Variant 2":`KJ5oTeQ79`,Default:`Trcb_EjRg`},me=d.create(t),he=({border:e,height:t,id:n,width:r,...i})=>({...i,BQt8Z6gvm:e??i.BQt8Z6gvm??{borderBottomWidth:1,borderColor:`var(--token-f6a5b1aa-e448-4107-a591-236bb16e708b)`,borderLeftWidth:0,borderRightWidth:0,borderStyle:`solid`,borderTopWidth:0},variant:pe[i.variant]??i.variant??`Trcb_EjRg`}),ge=(e,t)=>e.layoutDependency?t.join(`-`)+e.layoutDependency:t.join(`-`),B=T(/* @__PURE__ */ s(function(e,t){let n=u(null),r=t??n,i=l(),{activeLocale:a,setLocale:s}=I();ie();let{style:c,className:f,layoutId:p,variant:h,BQt8Z6gvm:g,..._}=he(e),{baseVariant:v,classNames:y,clearLoadingGesture:ee,gestureHandlers:x,gestureVariant:S,isLoading:C,setGestureState:te,setVariant:T,variants:E}=b({cycleOrder:ce,defaultVariant:`Trcb_EjRg`,ref:r,variant:h,variantClassNames:ue}),O=ge(e,E),k=w(le);return/*#__PURE__*/ o(m,{id:p??i,children:/*#__PURE__*/ o(me,{animate:E,initial:!1,children:/*#__PURE__*/ o(fe,{value:de,children:/*#__PURE__*/ o(d.header,{..._,...x,className:w(k,`framer-1dgoe84`,f,y),"data-border":!0,"data-framer-name":`Default`,layoutDependency:O,layoutId:`Trcb_EjRg`,ref:r,style:{"--border-bottom-width":(g?.borderBottomWidth??g?.borderWidth)+`px`,"--border-color":g?.borderColor,"--border-left-width":(g?.borderLeftWidth??g?.borderWidth)+`px`,"--border-right-width":(g?.borderRightWidth??g?.borderWidth)+`px`,"--border-style":g?.borderStyle,"--border-top-width":(g?.borderTopWidth??g?.borderWidth)+`px`,backgroundColor:`rgba(0, 0, 0, 0)`,...c},variants:{KJ5oTeQ79:{backgroundColor:`var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7, rgb(255, 255, 255))`}},...se({KJ5oTeQ79:{"data-framer-name":`Variant 2`}},v,S),children:/*#__PURE__*/ o(d.div,{className:`framer-i9la5b`,"data-framer-name":`Brand`,layoutDependency:O,layoutId:`mDwkQM8oG`,children:/*#__PURE__*/ o(M,{href:{webPageId:`augiA20Il`},motionChild:!0,nodeId:`v_cVoPtWP`,openInNewTab:!1,scopeId:`c3y3ftVLv`,children:/*#__PURE__*/ o(D,{as:`a`,className:`framer-kkoz7y framer-wrvswv`,"data-framer-name":`Logo`,layout:`position`,layoutDependency:O,layoutId:`v_cVoPtWP`,opacity:1,svg:`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 92 33"><g><defs><linearGradient id="idss11274128207_1g1195120356" x1="0.49751243781094523" x2="0.5024875621890548" y1="0" y2="1"><stop offset="0" stop-color="rgb(255, 255, 255)" stop-opacity="1"></stop><stop offset="1" stop-color="rgba(255, 255, 255, 0.6)" stop-opacity="0.6"></stop></linearGradient></defs><path d="M 18.575 14.404 L 15.264 15.092 C 14.662 12.426 12.254 10.879 9.546 10.879 C 6.579 10.879 4.644 12.254 4.644 14.533 C 4.644 16.769 6.794 17.328 9.288 17.758 L 11.695 18.145 C 15.565 18.833 19.134 19.994 19.134 24.681 C 19.134 29.282 15.092 31.647 9.847 31.647 C 4.343 31.647 0.645 28.766 0 24.595 L 3.311 23.907 C 3.913 27.218 6.536 28.809 9.847 28.809 C 13.071 28.809 15.436 27.347 15.436 24.81 C 15.436 22.402 13.243 21.714 10.276 21.198 L 7.912 20.811 C 4.515 20.209 0.946 19.048 0.946 14.533 C 0.946 10.707 4.472 7.998 9.546 7.998 C 14.361 7.998 17.973 10.965 18.575 14.404 Z M 39.723 31.131 L 36.197 31.174 C 35.896 30.787 35.638 29.626 35.595 27.949 C 33.875 30.744 30.264 31.69 27.555 31.69 C 23.599 31.69 20.331 29.11 20.331 24.982 C 20.331 19.994 24.33 18.403 29.877 17.801 C 34.477 17.242 35.509 16.64 35.509 15.049 C 35.509 12.684 34.047 11.008 30.349 11.008 C 27.899 11.008 25.405 12.082 24.502 15.221 L 21.191 14.447 C 22.223 10.148 25.964 7.998 30.478 7.998 C 36.713 7.998 39.121 11.051 39.121 14.963 L 39.121 25.928 C 39.121 28.594 39.207 29.97 39.723 31.131 Z M 35.509 22.144 L 35.509 19.048 C 34.778 19.865 32.026 20.209 29.533 20.553 C 27.082 20.897 23.986 22.015 23.986 24.982 C 23.986 27.39 25.663 28.723 28.243 28.723 C 31.252 28.723 35.509 27.218 35.509 22.144 Z M 41.316 1.87 C 41.316 0.837 42.153 0 43.186 0 C 44.219 0 45.057 0.837 45.057 1.87 L 45.057 2.257 C 45.057 3.29 44.219 4.128 43.186 4.128 C 42.153 4.128 41.316 3.29 41.316 2.257 Z M 41.402 8.514 L 44.971 8.514 L 44.971 31.13 L 41.402 31.13 Z M 50.813 11.738 L 50.942 11.738 C 52.361 9.417 55.027 7.998 58.123 7.998 C 62.509 7.998 66.163 10.578 66.163 16.081 L 66.163 31.131 L 62.552 31.131 L 62.552 17.328 C 62.552 12.856 60.832 11.051 57.177 11.051 C 54.081 11.051 50.985 13.372 50.985 18.575 L 50.985 31.131 L 47.416 31.131 L 47.416 8.514 L 50.813 8.514 Z M 86.212 20.274 C 85.97 26.696 78.735 28.104 74.907 25.11 C 76.175 26.382 77.361 27.498 77.943 27.974 C 84.476 33.312 92.597 25.029 87.536 18.767 C 86.224 17.141 82.085 12.968 80.46 11.705 C 79.788 11.183 78.467 10.544 77.634 10.414 C 72.175 9.565 68.036 14.804 70.328 19.841 C 70.666 20.585 72.165 22.281 73.775 23.954 C 72.886 22.759 72.412 21.169 72.639 19.202 C 73.601 10.87 86.531 11.785 86.212 20.274 Z M 79.31 25.079 C 80.166 24.697 83.238 21.66 83.931 20.827 C 86.963 17.179 82.258 12.644 78.701 15.47 C 77.776 16.203 75.406 18.514 74.689 19.421 C 74.392 19.796 74.029 20.534 73.955 21 C 73.473 24.048 76.449 26.359 79.31 25.079 Z M 78.933 31.99 C 62.691 31.388 64.359 6.228 80.854 8.097 C 95.775 9.79 94.135 32.552 78.933 31.99 Z" fill="url(#idss11274128207_1g1195120356)"></path></g></svg>`,svgContentId:11274128207,withExternalLayout:!0,...se({KJ5oTeQ79:{svg:`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 92 33"><path d="M 18.575 14.404 L 15.264 15.092 C 14.662 12.426 12.254 10.879 9.546 10.879 C 6.579 10.879 4.644 12.254 4.644 14.533 C 4.644 16.769 6.794 17.328 9.288 17.758 L 11.695 18.145 C 15.565 18.833 19.134 19.994 19.134 24.681 C 19.134 29.282 15.092 31.647 9.847 31.647 C 4.343 31.647 0.645 28.766 0 24.595 L 3.311 23.907 C 3.913 27.218 6.536 28.809 9.847 28.809 C 13.071 28.809 15.436 27.347 15.436 24.81 C 15.436 22.402 13.243 21.714 10.276 21.198 L 7.912 20.811 C 4.515 20.209 0.946 19.048 0.946 14.533 C 0.946 10.707 4.472 7.998 9.546 7.998 C 14.361 7.998 17.973 10.965 18.575 14.404 Z M 39.723 31.131 L 36.197 31.174 C 35.896 30.787 35.638 29.626 35.595 27.949 C 33.875 30.744 30.264 31.69 27.555 31.69 C 23.599 31.69 20.331 29.11 20.331 24.982 C 20.331 19.994 24.33 18.403 29.877 17.801 C 34.477 17.242 35.509 16.64 35.509 15.049 C 35.509 12.684 34.047 11.008 30.349 11.008 C 27.899 11.008 25.405 12.082 24.502 15.221 L 21.191 14.447 C 22.223 10.148 25.964 7.998 30.478 7.998 C 36.713 7.998 39.121 11.051 39.121 14.963 L 39.121 25.928 C 39.121 28.594 39.207 29.97 39.723 31.131 Z M 35.509 22.144 L 35.509 19.048 C 34.778 19.865 32.026 20.209 29.533 20.553 C 27.082 20.897 23.986 22.015 23.986 24.982 C 23.986 27.39 25.663 28.723 28.243 28.723 C 31.252 28.723 35.509 27.218 35.509 22.144 Z M 41.316 1.87 C 41.316 0.837 42.153 0 43.186 0 C 44.219 0 45.057 0.837 45.057 1.87 L 45.057 2.257 C 45.057 3.29 44.219 4.128 43.186 4.128 C 42.153 4.128 41.316 3.29 41.316 2.257 Z M 41.402 8.514 L 44.971 8.514 L 44.971 31.13 L 41.402 31.13 Z M 50.813 11.738 L 50.942 11.738 C 52.361 9.417 55.027 7.998 58.123 7.998 C 62.509 7.998 66.163 10.578 66.163 16.081 L 66.163 31.131 L 62.552 31.131 L 62.552 17.328 C 62.552 12.856 60.832 11.051 57.177 11.051 C 54.081 11.051 50.985 13.372 50.985 18.575 L 50.985 31.131 L 47.416 31.131 L 47.416 8.514 L 50.813 8.514 Z M 86.212 20.274 C 85.97 26.696 78.735 28.104 74.907 25.11 C 76.175 26.382 77.361 27.498 77.943 27.974 C 84.476 33.312 92.597 25.029 87.536 18.767 C 86.224 17.141 82.085 12.968 80.46 11.705 C 79.788 11.183 78.467 10.544 77.634 10.414 C 72.175 9.565 68.036 14.804 70.328 19.841 C 70.666 20.585 72.165 22.281 73.775 23.954 C 72.886 22.759 72.412 21.169 72.639 19.202 C 73.601 10.87 86.531 11.785 86.212 20.274 Z M 79.31 25.079 C 80.166 24.697 83.238 21.66 83.931 20.827 C 86.963 17.179 82.258 12.644 78.701 15.47 C 77.776 16.203 75.406 18.514 74.689 19.421 C 74.392 19.796 74.029 20.534 73.955 21 C 73.473 24.048 76.449 26.359 79.31 25.079 Z M 78.933 31.99 C 62.691 31.388 64.359 6.228 80.854 8.097 C 95.775 9.79 94.135 32.552 78.933 31.99 Z" fill="var(--token-d4b0c42c-2d4c-4b99-941a-36afc6d172ae, rgb(20, 20, 20)) /* {&quot;name&quot;:&quot;01&quot;} */"></path></svg>`,svgContentId:10874781225}},v,S)})})})})})})})}),[`.framer-MHPoo.framer-wrvswv, .framer-MHPoo .framer-wrvswv { display: block; }`,`.framer-MHPoo.framer-1dgoe84 { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 0px; height: 80px; justify-content: center; padding: 0px; position: relative; width: 1200px; }`,`.framer-MHPoo .framer-i9la5b { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 92px; z-index: 4; }`,`.framer-MHPoo .framer-kkoz7y { flex: none; height: 33px; position: relative; text-decoration: none; width: 92px; }`,`.framer-MHPoo[data-border="true"]::after, .framer-MHPoo [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }`],`framer-MHPoo`),B.displayName=`Header`,B.defaultProps={height:80,width:1200},g(B,{variant:{options:[`Trcb_EjRg`,`KJ5oTeQ79`],optionTitles:[`Default`,`Variant 2`],title:`Variant`,type:F.Enum},BQt8Z6gvm:{defaultValue:{borderBottomWidth:1,borderColor:`var(--token-f6a5b1aa-e448-4107-a591-236bb16e708b)`,borderLeftWidth:0,borderRightWidth:0,borderStyle:`solid`,borderTopWidth:0},title:`Border`,type:F.Border}}),P(B,[{explicitInter:!0,fonts:[]}],{supportsExplicitInterCodegen:!0})})))()}function V(e,...t){let n={};return t?.forEach(t=>t&&Object.assign(n,e[t])),n}var ve,ye,be,xe,Se,Ce,we,Te,Ee,De,Oe,ke,H;function U(){return(U=e((()=>{c(),j(),h(),r(),L(),ve=A(oe),ye={B9TU6Gi80:{hover:!0},v3zCiCl4g:{hover:!0}},be=[`v3zCiCl4g`,`B9TU6Gi80`],xe=`framer-FGfAs`,Se={B9TU6Gi80:`framer-v-1yxo64n`,v3zCiCl4g:`framer-v-1w37q8b`},Ce={delay:0,duration:.4,ease:[.44,0,.56,1],type:`tween`},we={delay:0,duration:.28,ease:[.22,1,.36,1],type:`tween`},Te=({value:e,children:t})=>{let r=i(f),a=e??r.transition,s=n(()=>({...r,transition:a}),[JSON.stringify(a)]);return/*#__PURE__*/ o(f.Provider,{value:s,children:t})},Ee={Default:`v3zCiCl4g`,Small:`B9TU6Gi80`},De=d.create(t),Oe=({height:e,id:t,label:n,link:r,width:i,...a})=>({...a,CKW8zpgvs:r??a.CKW8zpgvs,rFKLW_NTM:n??a.rFKLW_NTM??`Get Started`,variant:Ee[a.variant]??a.variant??`v3zCiCl4g`}),ke=(e,t)=>e.layoutDependency?t.join(`-`)+e.layoutDependency:t.join(`-`),H=T(/* @__PURE__ */ s(function(e,t){let n=u(null),r=t??n,i=l(),{activeLocale:s,setLocale:c}=I();ie();let{style:f,className:p,layoutId:h,variant:g,rFKLW_NTM:_,CKW8zpgvs:v,...ee}=Oe(e),{baseVariant:x,classNames:S,clearLoadingGesture:C,gestureHandlers:te,gestureVariant:T,isLoading:E,setGestureState:D,setVariant:O,variants:k}=b({cycleOrder:be,defaultVariant:`v3zCiCl4g`,enabledGestures:ye,ref:r,variant:g,variantClassNames:Se}),A=ke(e,k),j=w(xe);return/*#__PURE__*/ o(m,{id:h??i,children:/*#__PURE__*/ o(De,{animate:k,initial:!1,children:/*#__PURE__*/ o(Te,{value:Ce,...V({"v3zCiCl4g-hover":{value:we}},x,T),children:/*#__PURE__*/ o(M,{href:v,motionChild:!0,nodeId:`v3zCiCl4g`,openInNewTab:!1,scopeId:`EMrIvkId8`,smoothScroll:!0,children:/*#__PURE__*/ a(d.a,{...ee,...te,className:`${w(j,`framer-1w37q8b`,p,S)} framer-ovm3ce`,"data-framer-name":`Default`,"data-reset":`button`,layoutDependency:A,layoutId:`v3zCiCl4g`,ref:r,style:{backgroundColor:`var(--token-d4b0c42c-2d4c-4b99-941a-36afc6d172ae, rgb(20, 20, 20))`,borderBottomLeftRadius:999,borderBottomRightRadius:999,borderTopLeftRadius:999,borderTopRightRadius:999,boxShadow:`inset 0px 0px 2px 0px var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7, rgb(255, 255, 255)), inset 0px 0px 20px 0px rgba(255, 255, 255, 0.5)`,...f},variants:{"B9TU6Gi80-hover":{backgroundColor:`var(--token-d46bcdc5-7b34-460e-8bf5-768d512602d5, rgb(251, 88, 0))`,boxShadow:`inset 0px 0px 2px 0px var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7, rgb(255, 255, 255)), inset 0px 0px 20px 0px rgba(255, 255, 255, 0.75)`},"v3zCiCl4g-hover":{backgroundColor:`var(--token-d46bcdc5-7b34-460e-8bf5-768d512602d5, rgb(251, 88, 0))`,boxShadow:`inset 0px 0px 4px 0px var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7, rgb(255, 255, 255)), inset 0px 0px 24px 0px rgba(255, 255, 255, 0.75)`}},...V({B9TU6Gi80:{"data-framer-name":`Small`}},x,T),children:[/*#__PURE__*/ o(N,{children:/*#__PURE__*/ o(y,{className:`framer-ou7wkz-container`,isAuthoredByUser:!0,isModuleExternal:!0,layoutDependency:A,layoutId:`dPgVrRvoC-container`,nodeId:`dPgVrRvoC`,rendersWithMotion:!0,scopeId:`EMrIvkId8`,children:/*#__PURE__*/ o(oe,{clip:!0,color:`var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7, rgb(255, 255, 255))`,direction:`up`,effect:!0,font:{fontFamily:`"Geist", "Geist Placeholder", sans-serif`,fontSize:`16px`,fontStyle:`normal`,fontWeight:600,letterSpacing:`-0.03em`,lineHeight:`1.4em`,textAlign:`center`},height:`100%`,hoverColor:`var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7, rgb(255, 255, 255))`,id:`dPgVrRvoC`,layoutId:`dPgVrRvoC`,order:`forward`,stagger:.02,text:_,transition:{damping:34,delay:0,mass:1,stiffness:420,type:`spring`},trigger:`auto`,uppercase:!1,width:`100%`,...V({B9TU6Gi80:{font:{fontFamily:`"Geist", "Geist Placeholder", sans-serif`,fontSize:`14px`,fontStyle:`normal`,fontWeight:600,letterSpacing:`-0.03em`,lineHeight:`1.4em`,textAlign:`center`}}},x,T)})})}),/*#__PURE__*/ o(d.div,{className:`framer-143898o`,"data-framer-name":`Border`,layoutDependency:A,layoutId:`K2QqHczS5`,style:{backgroundColor:`var(--token-fa88adc3-9a07-4198-8b75-70941efaf5c7, rgba(0, 0, 0, 0.1))`,borderBottomLeftRadius:999,borderBottomRightRadius:999,borderTopLeftRadius:999,borderTopRightRadius:999}})]})})})})})}),[`.framer-FGfAs.framer-ovm3ce, .framer-FGfAs .framer-ovm3ce { display: block; }`,`.framer-FGfAs.framer-1w37q8b { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 8px; height: min-content; justify-content: center; overflow: visible; padding: 16px 24px 16px 24px; position: relative; text-decoration: none; width: min-content; }`,`.framer-FGfAs .framer-ou7wkz-container { flex: none; height: auto; position: relative; width: auto; }`,`.framer-FGfAs .framer-143898o { bottom: -2px; flex: none; left: -2px; overflow: visible; position: absolute; right: -2px; top: -2px; z-index: 0; }`,`.framer-FGfAs.framer-v-1yxo64n.framer-1w37q8b { padding: 12px 20px 12px 20px; }`],`framer-FGfAs`),H.displayName=`Button Primary`,H.defaultProps={height:54,width:134},g(H,{variant:{options:[`v3zCiCl4g`,`B9TU6Gi80`],optionTitles:[`Default`,`Small`],title:`Variant`,type:F.Enum},rFKLW_NTM:{defaultValue:`Get Started`,title:`Label`,type:F.String},onrFKLW_NTMChange:{changes:`rFKLW_NTM`,type:F.ChangeHandler},CKW8zpgvs:{title:`Link`,type:F.Link}}),P(H,[{explicitInter:!0,fonts:[{cssFamilyName:`Geist`,source:`google`,style:`normal`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBhhwUxId8gMGYQMKR3pzfaWI_RQuQ4mJPby1QNtA-866e2e90a35f.woff2`,weight:`600`}]},...ve],{supportsExplicitInterCodegen:!0})})))()}var W,G,K;function q(){return(q=e((()=>{j(),E.loadFonts([`GF;Instrument Serif-regular`,`GF;Instrument Serif-italic`]),W=[{explicitInter:!0,fonts:[{cssFamilyName:`Instrument Serif`,openType:!0,source:`google`,style:`normal`,uiFamilyName:`Instrument Serif`,url:`../../../assets/fonts/fonts.gstatic.com/jizBRFtNs2ka5fXjeivQ4LroWlx-2zcZj1bIkNo-85c697f41ee9.woff2`,weight:`400`},{cssFamilyName:`Instrument Serif`,openType:!0,source:`google`,style:`italic`,uiFamilyName:`Instrument Serif`,url:`../../../assets/fonts/fonts.gstatic.com/jizHRFtNs2ka5fXjeivQ4LroWlx-6zATjnTNgNq55w-e869f5f9a1e9.woff2`,weight:`400`}]}],G=[`.framer-lfW16 .framer-styles-preset-fhxely:not(.rich-text-wrapper), .framer-lfW16 .framer-styles-preset-fhxely.rich-text-wrapper h2 { --framer-font-family: "Instrument Serif", "Instrument Serif Placeholder", serif; --framer-font-family-italic: "Instrument Serif", "Instrument Serif Placeholder", serif; --framer-font-open-type-features: 'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on; --framer-font-size: 96px; --framer-font-style: normal; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.03em; --framer-line-height: 0.9em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-cfec3799-fb80-48b2-b0c4-51f5c9476ca6); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }`,`@media (max-width: 1199px) and (min-width: 810px) { .framer-lfW16 .framer-styles-preset-fhxely:not(.rich-text-wrapper), .framer-lfW16 .framer-styles-preset-fhxely.rich-text-wrapper h2 { --framer-font-family: "Instrument Serif", "Instrument Serif Placeholder", serif; --framer-font-family-italic: "Instrument Serif", "Instrument Serif Placeholder", serif; --framer-font-open-type-features: 'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on; --framer-font-size: 72px; --framer-font-style: normal; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.03em; --framer-line-height: 0.9em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-cfec3799-fb80-48b2-b0c4-51f5c9476ca6); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; } }`,`@media (max-width: 809px) and (min-width: 0px) { .framer-lfW16 .framer-styles-preset-fhxely:not(.rich-text-wrapper), .framer-lfW16 .framer-styles-preset-fhxely.rich-text-wrapper h2 { --framer-font-family: "Instrument Serif", "Instrument Serif Placeholder", serif; --framer-font-family-italic: "Instrument Serif", "Instrument Serif Placeholder", serif; --framer-font-open-type-features: 'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on; --framer-font-size: 48px; --framer-font-style: normal; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.03em; --framer-line-height: 0.9em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-cfec3799-fb80-48b2-b0c4-51f5c9476ca6); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; } }`],K=`framer-lfW16`})))()}var J,Y,Ae;function je(){return(je=e((()=>{j(),E.loadFonts([`GF;Geist-regular`,`GF;Geist-700`,`GF;Geist-700italic`,`GF;Geist-italic`]),J=[{explicitInter:!0,fonts:[{cssFamilyName:`Geist`,openType:!0,source:`google`,style:`normal`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4mJPby1QNtA-bd62e9d30786.woff2`,weight:`400`},{cssFamilyName:`Geist`,openType:!0,source:`google`,style:`normal`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBhhwUxId8gMGYQMKR3pzfaWI_Re-Q4mJPby1QNtA-20a1482f3383.woff2`,weight:`700`},{cssFamilyName:`Geist`,openType:!0,source:`google`,style:`italic`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBjhwUxId8gMEwZAluvzlxA9ojEVKA32Zna6VEdtKCL-bfd684313d75.woff2`,weight:`700`},{cssFamilyName:`Geist`,openType:!0,source:`google`,style:`italic`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBjhwUxId8gMEwZAluvzlxA9ojEVKDQ3pna6VEdtKCL-d5e9cc9d0ddf.woff2`,weight:`400`}]}],Y=[`.framer-xyBAh .framer-styles-preset-nw6psy:not(.rich-text-wrapper), .framer-xyBAh .framer-styles-preset-nw6psy.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: 'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on; --framer-font-size: 20px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.03em; --framer-line-height: 1.2em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-2fdd724f-4077-4248-b181-e41e06c2b739); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }`],Ae=`framer-xyBAh`})))()}function Me(e){switch(e){case`top`:return`Text Top`;case`center`:return`Central`;case`bottom`:return`Hanging`}}var X,Ne;function Pe(){return(Pe=e((()=>{c(),j(),X=T(function(e){let t={...e,width:e.width??50,height:e.height??50};S.current(),S.canvas;let n=t.type?0:t.cylinderHeight/2,r=Ne(t.flip,n),i=`curve-${p(r)}`,s=Me(t.alignmentBaseline);return/*#__PURE__*/ a(`svg`,{className:`transform-origin-center-center`,style:{width:`100%`,height:`100%`,transformOrigin:`center`},viewBox:`0 0 100 100`,overflow:`visible`,children:[/*#__PURE__*/ o(`path`,{id:i,d:r,strokeWidth:`none`,fill:`transparent`}),/*#__PURE__*/ o(`text`,{children:/*#__PURE__*/ o(`textPath`,{href:`#${i}`,startOffset:t.startOffset,dominantBaseline:s,style:{letterSpacing:t.font?.letterSpacing?t.font.letterSpacing:1.85,...t.font,fill:t.color},children:t.text})})]})},[`.transform-origin-center-center { transform-origin: center center !important; }`],`framer-arc-text`),g(X,{text:{title:`Content`,type:F.String,defaultValue:`DESIGN SITES LIKE A PRO WITH FRAMER`,displayTextArea:!0},type:{title:`Type`,type:F.Boolean,enabledTitle:`Circle`,disabledTitle:`Ellipse`,defaultValue:!0},cylinderHeight:{title:`Height`,type:F.Number,min:0,max:1e3,displayStepper:!0,hidden:e=>e.type},alignmentBaseline:{title:`Align`,type:F.Enum,options:[`top`,`center`,`bottom`],optionIcons:[`align-top`,`align-middle`,`align-bottom`],defaultValue:`bottom`,displaySegmentedControl:!0},flip:{type:F.Boolean,defaultValue:!1,title:`Direction`,enabledTitle:`CW`,disabledTitle:`CCW`},startOffset:{title:`Offset`,type:F.Number,defaultValue:0,max:360,unit:`°`,step:.5},font:{type:F.Font,title:`Font`,controls:`extended`,displayTextAlignment:!1},color:{title:`Color`,type:F.Color,defaultValue:`#999`}}),Ne=(e,t)=>{let n=50-t,r=50+t;return e?`M 0 50 L 0 ${r} A 1 1 0 1 0 100 ${r} L 100 ${n} A 1 1 0 1 0 0 ${n} L 0 50`:`M 0 50 L 0 ${n} A 1 1 0 0 1 100 ${n} L 100 50 L 100 ${r} A 1 1 0 0 1 0 ${r} L 0 ${n}`}})))()}var Fe,Ie,Le;function Re(){return(Re=e((()=>{j(),E.loadFonts([`GF;Geist-regular`,`GF;Geist-700`,`GF;Geist-700italic`,`GF;Geist-italic`]),Fe=[{explicitInter:!0,fonts:[{cssFamilyName:`Geist`,openType:!0,source:`google`,style:`normal`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4mJPby1QNtA-bd62e9d30786.woff2`,weight:`400`},{cssFamilyName:`Geist`,openType:!0,source:`google`,style:`normal`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBhhwUxId8gMGYQMKR3pzfaWI_Re-Q4mJPby1QNtA-20a1482f3383.woff2`,weight:`700`},{cssFamilyName:`Geist`,openType:!0,source:`google`,style:`italic`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBjhwUxId8gMEwZAluvzlxA9ojEVKA32Zna6VEdtKCL-bfd684313d75.woff2`,weight:`700`},{cssFamilyName:`Geist`,openType:!0,source:`google`,style:`italic`,uiFamilyName:`Geist`,url:`../../../assets/fonts/fonts.gstatic.com/gyBjhwUxId8gMEwZAluvzlxA9ojEVKDQ3pna6VEdtKCL-d5e9cc9d0ddf.woff2`,weight:`400`}]}],Ie=[`.framer-qBwnv .framer-styles-preset-6ntjjf:not(.rich-text-wrapper), .framer-qBwnv .framer-styles-preset-6ntjjf.rich-text-wrapper p { --framer-font-family: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-bold-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-family-italic: "Geist", "Geist Placeholder", sans-serif; --framer-font-open-type-features: 'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on; --framer-font-size: 24px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.03em; --framer-line-height: 1.2em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-2fdd724f-4077-4248-b181-e41e06c2b739); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }`],Le=`framer-qBwnv`})))()}function Z(e,...t){let n={};return t?.forEach(t=>t&&Object.assign(n,e[t])),n}var ze,Be,Ve,He,Ue,We,Q,Ge,Ke,qe,Je,Ye,Xe,Ze,Qe,$e,et,tt,nt,rt,it,$;function at(){return(at=e((()=>{c(),j(),h(),r(),Pe(),z(),Re(),q(),je(),U(),ze=A(X),Be=_(y),Ve=A(H),He=[`GJwGy45UQ`,`ydWZxb0WO`,`C90iL9CtJ`],Ue=`framer-YK9lu`,We={C90iL9CtJ:`framer-v-stc1yh`,GJwGy45UQ:`framer-v-2k6pec`,ydWZxb0WO:`framer-v-1t17w7t`},Q={delay:0,duration:.4,ease:[.44,0,.56,1],type:`tween`},Ge=(e,t)=>`translate(-50%, -50%) ${t}`,Ke={opacity:0,rotate:0,rotateX:0,rotateY:0,scale:1,skewX:0,skewY:0,x:0,y:0},qe={opacity:0,rotate:0,rotateX:0,rotateY:0,scale:1,skewX:0,skewY:0,transition:Q,x:0,y:0},Je={delay:0,duration:20,ease:[0,0,1,1],type:`tween`},Ye={opacity:1,rotate:360,rotateX:0,rotateY:0,scale:1,skewX:0,skewY:0,x:0,y:0},Xe={effect:{filter:`blur(10px)`,opacity:.001,rotate:0,scale:1,skewX:0,skewY:0,x:0,y:0},repeat:!1,startDelay:.1,threshold:0,tokenization:`word`,transition:{delay:.05,duration:.8,ease:[.21,.61,.35,1],type:`tween`},trigger:`onInView`,type:`appear`},Ze=(...e)=>{for(let t of e)if(t&&typeof t==`string`)return t},Qe=({value:e,children:t})=>{let r=i(f),a=e??r.transition,s=n(()=>({...r,transition:a}),[JSON.stringify(a)]);return/*#__PURE__*/ o(f.Provider,{value:s,children:t})},$e={Desktop:`GJwGy45UQ`,Mobile:`C90iL9CtJ`,Tablet:`ydWZxb0WO`},et=d.create(t),tt=({height:e,id:t,width:n,...r})=>({...r,variant:$e[r.variant]??r.variant??`GJwGy45UQ`}),nt=(e,t)=>e.layoutDependency?t.join(`-`)+e.layoutDependency:t.join(`-`),rt=/*#__PURE__*/ s(function(e,n){let r=u(null),i=n??r,s=l(),{activeLocale:c,setLocale:f}=I(),p=ie(),{style:h,className:g,layoutId:_,variant:x,...S}=tt(e),{baseVariant:C,classNames:te,clearLoadingGesture:T,gestureHandlers:E,gestureVariant:D,isLoading:A,setGestureState:j,setVariant:ne,variants:M}=b({cycleOrder:He,defaultVariant:`GJwGy45UQ`,ref:i,variant:x,variantClassNames:We}),P=nt(e,M),F=w(Ue,Le,Ae,K);O();let L=()=>C!==`C90iL9CtJ`;return/*#__PURE__*/ o(m,{id:_??s,children:/*#__PURE__*/ o(et,{animate:M,initial:!1,children:/*#__PURE__*/ o(Qe,{value:Q,children:/*#__PURE__*/ a(d.section,{...S,...E,className:w(F,`framer-2k6pec`,g,te),"data-framer-name":`Desktop`,layoutDependency:P,layoutId:`GJwGy45UQ`,ref:i,style:{backgroundColor:`var(--token-d4b0c42c-2d4c-4b99-941a-36afc6d172ae, rgb(20, 20, 20))`,...h},...Z({C90iL9CtJ:{"data-framer-name":`Mobile`},ydWZxb0WO:{"data-framer-name":`Tablet`}},C,D),children:[/*#__PURE__*/ o(d.div,{className:`framer-xir3cn`,"data-border":!0,"data-framer-name":`Container`,layoutDependency:P,layoutId:`IGDC8Ao_7`,style:{"--border-bottom-width":`0px`,"--border-color":`var(--token-d90687c6-417d-455d-ae73-bac1542f4c34, rgba(255, 255, 255, 0.1))`,"--border-left-width":`1px`,"--border-right-width":`1px`,"--border-style":`solid`,"--border-top-width":`0px`},variants:{C90iL9CtJ:{"--border-left-width":`0px`,"--border-right-width":`0px`}},children:/*#__PURE__*/ a(d.div,{className:`framer-1vdshn9`,"data-framer-name":`CTA Card`,layoutDependency:P,layoutId:`frhEeFlV_`,style:{borderBottomLeftRadius:40,borderBottomRightRadius:40,borderTopLeftRadius:40,borderTopRightRadius:40},children:[/*#__PURE__*/ a(d.div,{className:`framer-gtv6xx`,"data-framer-name":`Content Wrap`,layoutDependency:P,layoutId:`yE89NsfAm`,children:[/*#__PURE__*/ a(d.div,{className:`framer-xff9dc`,"data-framer-name":`Top`,layoutDependency:P,layoutId:`tO55l9Xrh`,children:[/*#__PURE__*/ a(d.div,{className:`framer-zqcauu`,"data-framer-name":`Arc`,layoutDependency:P,layoutId:`GkUabdYFE`,children:[/*#__PURE__*/ o(re,{background:{alt:`Saino logo badge`,fit:`fill`,intrinsicHeight:292,intrinsicWidth:292,loading:k((p?.y||0)+152),pixelHeight:292,pixelWidth:292,sizes:`40px`,src:`../../../assets/images/framerusercontent.com/jEdLYTzGeRHmLrNr9VhoDJl8ZY4-ade70a128b7a.png`},className:`framer-1r1tgrz`,"data-framer-name":`Badge`,layoutDependency:P,layoutId:`mkVzTogot`,transformTemplate:Ge,...Z({C90iL9CtJ:{background:{alt:`Saino logo badge`,fit:`fill`,intrinsicHeight:292,intrinsicWidth:292,loading:k((p?.y||0)+88),pixelHeight:292,pixelWidth:292,sizes:`40px`,src:`../../../assets/images/framerusercontent.com/jEdLYTzGeRHmLrNr9VhoDJl8ZY4-ade70a128b7a.png`}},ydWZxb0WO:{background:{alt:`Saino logo badge`,fit:`fill`,intrinsicHeight:292,intrinsicWidth:292,loading:k((p?.y||0)+136),pixelHeight:292,pixelWidth:292,sizes:`40px`,src:`../../../assets/images/framerusercontent.com/jEdLYTzGeRHmLrNr9VhoDJl8ZY4-ade70a128b7a.png`}}},C,D)}),/*#__PURE__*/ o(N,{children:/*#__PURE__*/ o(Be,{__framer__animate:{transition:Q},__framer__animateOnce:!1,__framer__enter:Ke,__framer__exit:qe,__framer__loop:Ye,__framer__loopEffectEnabled:!0,__framer__loopPauseOffscreen:!0,__framer__loopRepeatDelay:0,__framer__loopRepeatType:`loop`,__framer__loopTransition:Je,__framer__styleAppearEffectEnabled:!0,__framer__threshold:.5,__perspectiveFX:!1,__smartComponentFX:!0,__targetOpacity:.9,className:`framer-n99thz-container`,isAuthoredByUser:!0,isModuleExternal:!0,layoutDependency:P,layoutId:`TpQ4npwGH-container`,nodeId:`TpQ4npwGH`,rendersWithMotion:!0,scopeId:`PTqkVmIc5`,style:{opacity:.9},children:/*#__PURE__*/ o(X,{alignmentBaseline:`bottom`,color:`var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7, rgb(255, 255, 255))`,cylinderHeight:0,flip:!1,font:{fontFamily:`"Inter Display", "Inter Display Placeholder", sans-serif`,fontSize:`16px`,fontStyle:`normal`,fontWeight:400,letterSpacing:`0.04em`,lineHeight:`0.9em`},height:`100%`,id:`TpQ4npwGH`,layoutId:`TpQ4npwGH`,startOffset:0,style:{height:`100%`,width:`100%`},text:`saino saino saino saino saino saino saino `,type:!0,width:`100%`})})})]}),/*#__PURE__*/ o(ae,{__fromCanvasComponent:!0,children:/*#__PURE__*/ o(t,{children:/*#__PURE__*/ o(d.p,{className:`framer-styles-preset-6ntjjf`,"data-styles-preset":`AfcRZlGlc`,dir:`auto`,style:{"--framer-text-alignment":`center`,"--framer-text-color":`var(--extracted-r6o4lv, var(--token-08a73e07-c725-4b34-badd-6d3591a8fc90))`},children:`Have any new product idea?`})}),className:`framer-1r8tgft`,"data-framer-name":`Eyebrow`,fonts:[`Inter`],layoutDependency:P,layoutId:`Enfzs9ekW`,style:{"--extracted-r6o4lv":`var(--token-08a73e07-c725-4b34-badd-6d3591a8fc90)`},verticalAlignment:`top`,withExternalLayout:!0,...Z({C90iL9CtJ:{children:/*#__PURE__*/ o(t,{children:/*#__PURE__*/ o(d.p,{className:`framer-styles-preset-nw6psy`,"data-styles-preset":`PMYTpmPfZ`,dir:`auto`,style:{"--framer-text-alignment":`center`,"--framer-text-color":`var(--extracted-r6o4lv, var(--token-08a73e07-c725-4b34-badd-6d3591a8fc90))`},children:`Have any new product idea?`})})}},C,D)})]}),/*#__PURE__*/ o(ae,{__fromCanvasComponent:!0,children:/*#__PURE__*/ o(t,{children:/*#__PURE__*/ a(d.h2,{className:`framer-styles-preset-fhxely`,"data-styles-preset":`d4JJMWkh2`,dir:`auto`,style:{"--framer-text-alignment":`center`,"--framer-text-color":`var(--extracted-1of0zx5, var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7))`},children:[`Launch Your AI-Powered`,/*#__PURE__*/ o(d.br,{}),`Product Today!`]})}),className:`framer-cv2sed`,"data-framer-name":`Heading`,effect:Xe,fonts:[`Inter`],layoutDependency:P,layoutId:`hb0C2EBhG`,style:{"--extracted-1of0zx5":`var(--token-53c8f387-7e7a-4f96-9e79-cd04412efca7)`},verticalAlignment:`top`,withExternalLayout:!0})]}),/*#__PURE__*/ o(v,{links:[{href:{webPageId:`p0fhjUpZE`},implicitPathVariables:void 0},{href:{webPageId:`p0fhjUpZE`},implicitPathVariables:void 0},{href:{webPageId:`p0fhjUpZE`},implicitPathVariables:void 0}],children:e=>/*#__PURE__*/ o(N,{height:54,y:(p?.y||0)+534.4,...Z({C90iL9CtJ:{y:(p?.y||0)+470.4},ydWZxb0WO:{y:(p?.y||0)+518.4}},C,D),children:/*#__PURE__*/ o(y,{className:`framer-k3o2uh-container`,layoutDependency:P,layoutId:`fdttpusH4-container`,nodeId:`fdttpusH4`,rendersWithMotion:!0,scopeId:`PTqkVmIc5`,children:/*#__PURE__*/ o(H,{CKW8zpgvs:e[0],height:`100%`,id:`fdttpusH4`,layoutId:`fdttpusH4`,rFKLW_NTM:`Start your Free Trial`,variant:Ze(`v3zCiCl4g`),width:`100%`,...Z({C90iL9CtJ:{CKW8zpgvs:e[2]},ydWZxb0WO:{CKW8zpgvs:e[1]}},C,D)})})})}),/*#__PURE__*/ o(d.div,{className:`framer-1vc1pxl`,"data-framer-name":`Background CTA`,layoutDependency:P,layoutId:`ZqkqwNeuQ`,style:{borderBottomLeftRadius:80,borderBottomRightRadius:80,borderTopLeftRadius:80,borderTopRightRadius:80},variants:{C90iL9CtJ:{borderBottomLeftRadius:64,borderBottomRightRadius:64,borderTopLeftRadius:64,borderTopRightRadius:64},ydWZxb0WO:{borderBottomLeftRadius:88,borderBottomRightRadius:88,borderTopLeftRadius:88,borderTopRightRadius:88}},children:/*#__PURE__*/ o(y,{className:`framer-1f5ae03-container`,layoutDependency:P,layoutId:`gEYMpb9SL-container`,rendersWithMotion:!0,children:/*#__PURE__*/ o(ee,{__fromCanvasComponent:!0,animated:R.animated,buffers:R.buffers,fallbackImage:`https://framerusercontent.com/images/pGWliYWfFUv4vQcq1Fj3eQjeEWI.png?scale-down-to=1344&width=2688&height=1088`,fragmentShader:R.fragment,height:`100%`,heightmapSource:R.heightmapSource,mode:`progressive`,mouse:R.mouse&&{enabled:R.mouse===`enabledByDefault`},resolutionScale:R.resolutionScale,skipInitialFallback:!0,uniforms:{u_colors:{type:`array`,value:[`rgb(10, 5, 1)`,`var(--token-d46bcdc5-7b34-460e-8bf5-768d512602d5, rgb(251, 88, 0))`,`rgb(247, 169, 0)`,`rgb(255, 47, 0)`,`rgb(227, 204, 141)`]},u_contrast:{type:`number`,value:1.1},u_distBias:{type:`number`,value:0},u_dither:{type:`number`,value:.1},u_ditherMode:{type:`enum`,value:1},u_exposure:{type:`number`,value:1.1},u_jellify:{type:`boolean`,value:!1},u_loop:{type:`number`,value:0},u_mousePersist:{type:`number`,value:.8},u_mousePush:{type:`number`,value:.5},u_mouseRadius:{type:`number`,value:1},u_mouseStretch:{type:`number`,value:0},u_saturation:{type:`number`,value:1},u_scale:{type:`number`,value:.5},u_seed:{type:`number`,value:289},u_speed:{type:`number`,value:1.4},u_turbAmp:{type:`number`,value:.6},u_turbFreq:{type:`number`,value:1.9},u_turbIter:{type:`number`,value:3},u_waveFreq:{type:`number`,value:2.4}},vertexShader:R.vertex,width:`100%`,...Z({C90iL9CtJ:{fallbackImage:`https://framerusercontent.com/images/1N5VcpUZVIlYXGZfwmsVrIrt0.png?scale-down-to=837&width=736&height=1674`},ydWZxb0WO:{fallbackImage:`https://framerusercontent.com/images/W1fbvn5RtvEkQKyTGmiLSDxI.png?scale-down-to=736&width=1472&height=1260`}},C,D)})})})]})}),L()&&/*#__PURE__*/ o(d.div,{className:`framer-6i2agf`,"data-framer-name":`Divider`,layoutDependency:P,layoutId:`HPloByv9b`,style:{backgroundColor:`var(--token-d90687c6-417d-455d-ae73-bac1542f4c34)`}}),L()&&/*#__PURE__*/ o(d.div,{className:`framer-6qb318`,"data-framer-name":`Divider`,layoutDependency:P,layoutId:`UHVCE09B1`,style:{backgroundColor:`var(--token-d90687c6-417d-455d-ae73-bac1542f4c34)`}})]})})})})}),it=[`.framer-YK9lu.framer-b1mjyb, .framer-YK9lu .framer-b1mjyb { display: block; }`,`.framer-YK9lu.framer-2k6pec { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; overflow: hidden; padding: 0px 80px 0px 80px; position: relative; width: 1440px; }`,`.framer-YK9lu .framer-xir3cn { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; max-width: 1280px; overflow: visible; padding: 80px 0px 80px 0px; position: relative; width: 100%; }`,`.framer-YK9lu .framer-1vdshn9 { align-content: center; align-items: center; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 48px; height: min-content; justify-content: flex-start; padding: 64px; position: relative; width: 1px; z-index: 0; }`,`.framer-YK9lu .framer-gtv6xx { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 24px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; z-index: 2; }`,`.framer-YK9lu .framer-xff9dc { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 8px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; z-index: 2; }`,`.framer-YK9lu .framer-zqcauu { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: 80px; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 80px; }`,`.framer-YK9lu .framer-1r1tgrz { aspect-ratio: 1 / 1; flex: none; height: auto; left: 50%; mix-blend-mode: hard-light; overflow: var(--overflow-clip-fallback, clip); position: absolute; top: 50%; width: 40px; will-change: var(--framer-will-change-filter-override, filter); z-index: 1; }`,`.framer-YK9lu .framer-n99thz-container { flex: 1 0 0px; height: 100%; position: relative; width: 1px; }`,`.framer-YK9lu .framer-1r8tgft { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }`,`.framer-YK9lu .framer-cv2sed { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; z-index: 2; }`,`.framer-YK9lu .framer-k3o2uh-container { flex: none; height: auto; position: relative; width: auto; z-index: 2; }`,`.framer-YK9lu .framer-1vc1pxl { bottom: 0px; flex: none; left: -31px; overflow: var(--overflow-clip-fallback, clip); position: absolute; right: -33px; top: 0px; will-change: var(--framer-will-change-override, transform); z-index: 1; }`,`.framer-YK9lu .framer-1f5ae03-container { bottom: 0px; flex: none; left: 0px; position: absolute; right: 0px; top: 0px; }`,`.framer-YK9lu .framer-6i2agf { flex: none; height: 1px; left: 0px; position: absolute; right: 0px; top: 112px; z-index: 3; }`,`.framer-YK9lu .framer-6qb318 { bottom: 112px; flex: none; height: 1px; left: 0px; position: absolute; right: 0px; z-index: 3; }`,`.framer-YK9lu.framer-v-1t17w7t.framer-2k6pec { padding: 0px 32px 0px 32px; width: 800px; }`,`.framer-YK9lu.framer-v-1t17w7t .framer-xir3cn { padding: 64px 0px 64px 0px; }`,`.framer-YK9lu.framer-v-1t17w7t .framer-1vc1pxl, .framer-YK9lu.framer-v-stc1yh .framer-1vc1pxl { left: 0px; right: 0px; }`,`.framer-YK9lu.framer-v-1t17w7t .framer-6i2agf { top: 80px; }`,`.framer-YK9lu.framer-v-1t17w7t .framer-6qb318 { bottom: 80px; }`,`.framer-YK9lu.framer-v-stc1yh.framer-2k6pec { padding: 0px 16px 0px 16px; width: 400px; }`,`.framer-YK9lu.framer-v-stc1yh .framer-xir3cn { padding: 40px 0px 40px 0px; }`,`.framer-YK9lu.framer-v-stc1yh .framer-1vdshn9 { padding: 40px 16px 40px 16px; }`,`.framer-YK9lu.framer-v-stc1yh .framer-gtv6xx { gap: 48px; }`,...Ie,...Y,...G,`.framer-YK9lu[data-border="true"]::after, .framer-YK9lu [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }`],$=T(rt,it,`framer-YK9lu`),$.displayName=`CTA Section`,$.defaultProps={height:704,width:1440},g($,{variant:{options:[`GJwGy45UQ`,`ydWZxb0WO`,`C90iL9CtJ`],optionTitles:[`Desktop`,`Tablet`,`Mobile`],title:`Variant`,type:F.Enum}}),P($,[{explicitInter:!0,fonts:[{cssFamilyName:`Inter Display`,source:`framer`,style:`normal`,uiFamilyName:`Inter Display`,unicodeRange:`U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F`,url:`../../../assets/fonts/framerusercontent.com/2uIBiALfCHVpWbHqRMZutfT7giU-28506ddaf7ab.woff2`,weight:`400`},{cssFamilyName:`Inter Display`,source:`framer`,style:`normal`,uiFamilyName:`Inter Display`,unicodeRange:`U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116`,url:`../../../assets/fonts/framerusercontent.com/Zwfz6xbVe5pmcWRJRgBDHnMkOkI-a5368cb4d523.woff2`,weight:`400`},{cssFamilyName:`Inter Display`,source:`framer`,style:`normal`,uiFamilyName:`Inter Display`,unicodeRange:`U+1F00-1FFF`,url:`../../../assets/fonts/framerusercontent.com/U9LaDDmbRhzX3sB8g8glTy5feTE-829de2c17804.woff2`,weight:`400`},{cssFamilyName:`Inter Display`,source:`framer`,style:`normal`,uiFamilyName:`Inter Display`,unicodeRange:`U+0370-03FF`,url:`../../../assets/fonts/framerusercontent.com/tVew2LzXJ1t7QfxP1gdTIdj2o0g-31ed49aa3bf3.woff2`,weight:`400`},{cssFamilyName:`Inter Display`,source:`framer`,style:`normal`,uiFamilyName:`Inter Display`,unicodeRange:`U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF`,url:`../../../assets/fonts/framerusercontent.com/DF7bjCRmStYPqSb945lAlMfCCVQ-31b9b1d61473.woff2`,weight:`400`},{cssFamilyName:`Inter Display`,source:`framer`,style:`normal`,uiFamilyName:`Inter Display`,unicodeRange:`U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`,url:`../../../assets/fonts/framerusercontent.com/bHYNJqzTyl2lqvmMiRRS6Y16Es-5e3fa6db3c72.woff2`,weight:`400`},{cssFamilyName:`Inter Display`,source:`framer`,style:`normal`,uiFamilyName:`Inter Display`,unicodeRange:`U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB`,url:`../../../assets/fonts/framerusercontent.com/vebZUMjGyKkYsfcY73iwWTzLNag-bcbf906d4c64.woff2`,weight:`400`},{cssFamilyName:`Inter`,source:`framer`,style:`normal`,uiFamilyName:`Inter`,unicodeRange:`U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F`,url:`../../../assets/fonts/framerusercontent.com/5vvr9Vy74if2I6bQbJvbw7SY1pQ-197dd743787c.woff2`,weight:`400`},{cssFamilyName:`Inter`,source:`framer`,style:`normal`,uiFamilyName:`Inter`,unicodeRange:`U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116`,url:`../../../assets/fonts/framerusercontent.com/EOr0mi4hNtlgWNn9if640EZzXCo-f3fd018548ab.woff2`,weight:`400`},{cssFamilyName:`Inter`,source:`framer`,style:`normal`,uiFamilyName:`Inter`,unicodeRange:`U+1F00-1FFF`,url:`../../../assets/fonts/framerusercontent.com/Y9k9QrlZAqio88Klkmbd8VoMQc-bb12e146cad6.woff2`,weight:`400`},{cssFamilyName:`Inter`,source:`framer`,style:`normal`,uiFamilyName:`Inter`,unicodeRange:`U+0370-03FF`,url:`../../../assets/fonts/framerusercontent.com/OYrD2tBIBPvoJXiIHnLoOXnY9M-ea808fe7d65d.woff2`,weight:`400`},{cssFamilyName:`Inter`,source:`framer`,style:`normal`,uiFamilyName:`Inter`,unicodeRange:`U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF`,url:`../../../assets/fonts/framerusercontent.com/JeYwfuaPfZHQhEG8U5gtPDZ7WQ-418c934c0013.woff2`,weight:`400`},{cssFamilyName:`Inter`,source:`framer`,style:`normal`,uiFamilyName:`Inter`,unicodeRange:`U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`,url:`../../../assets/fonts/framerusercontent.com/GrgcKwrN6d3Uz8EwcLHZxwEfC4-d2835f64bac0.woff2`,weight:`400`},{cssFamilyName:`Inter`,source:`framer`,style:`normal`,uiFamilyName:`Inter`,unicodeRange:`U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB`,url:`../../../assets/fonts/framerusercontent.com/b6Y37FthZeALduNqHicBT6FutY-22b5f26fb634.woff2`,weight:`400`}]},...ze,...Ve,...C(Fe),...C(J),...C(W)],{supportsExplicitInterCodegen:!0}),$.loader={load:(e,t)=>ne([()=>x(H,{},t)],t)}})))()}function ot(e,t){return{description:`Saino is an AI Micro-SaaS platform that turns any input into structured output. Generate, refine, extract and automate with one flexible AI engine.`,favicon:`https://framerusercontent.com/assets/k8HQGWIYcGbZ0MFXw8X5o9tEEq8.png`,robots:`max-image-preview:large`,socialImage:`https://framerusercontent.com/assets/PrY2yQr1KA8oYMEOfgyy9zY3T8.png`,title:`Saino - AI Micro-SaaS Template`}}function st(){return(st=e((()=>{})))()}export{z as S,H as _,Le as a,_e as b,Re as c,J as d,je as f,q as g,W as h,at as i,Ae as l,G as m,ot as n,Ie as o,K as p,$ as r,Fe as s,st as t,Y as u,U as v,R as x,B as y};
//# sourceMappingURL=shared-lib.pT6Gzepr.mjs.map