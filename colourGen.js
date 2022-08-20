
let initial = null;

let colourDict = {};

loadColourBounds();

let colourRanges = [];

export default function colourGen (options) {

  options = options || {};

  if (options.initial !== undefined && options.initial !== null && options.initial === parseInt(options.initial, 10)) {
    initial = options.initial;


  } else if (typeof options.initial === 'string') {
    initial = stringToInteger(options.initial);

  } else if (options.initial !== undefined && options.initial !== null) {
    throw new TypeError('The initial value must be an integer or string');

  } else {
    initial = null;
  }

  let H,S,B;

  if (options.count !== null && options.count !== undefined) {

    let totalColours = options.count,
        colours = [];
    
    for (let i = 0; i < options.count; i++) {
      colourRanges.push(false)
      }
    options.count = null;

    while (totalColours > colours.length) {

      let colour = colourGen(options);

      if (initial !== null) {
        options.initial = initial;
      }

      colours.push(colour);
    }

    options.count = totalColours;

    return colours;
  }

  // pick a hue (H)
  H = selectHue(options);

  // determine saturation (S)
  S = selectSaturation(H, options);

  // determine brightness (B).
  B = selectBrightness(H, S, options);

  // return HSB colour
  return setFormat([H,S,B], options);
};

const selectHue = (options) => {
  if (colourRanges.length > 0) {
    let hueRange = getRealHueRange(options.hue)

    let hue = randomWithin(hueRange)

    let step = (hueRange[1] - hueRange[0]) / colourRanges.length

    let j = parseInt((hue - hueRange[0]) / step)

    if (colourRanges[j] === true) {
      j = (j + 2) % colourRanges.length
    }
    else {
      colourRanges[j] = true
         }

    let min = (hueRange[0] + j * step) % 359,
        max = (hueRange[0] + (j + 1) * step) % 359;

    hueRange = [min, max]

    hue = randomWithin(hueRange)

    if (hue < 0) {hue = 360 + hue;}
    return hue
  }
  else {
    let hueRange = getHueRange(options.hue)

    hue = randomWithin(hueRange);
    if (hue < 0) {
      hue = 360 + hue;
    }

    return hue;
  }
}

const selectSaturation = (hue, options) => {

  if (options.hue === 'monochrome') {
    return 0;
  }

  if (options.luminosity === 'random') {
    return randomWithin([0,100]);
  }

  let saturationRange = getSaturationRange(hue);

  let sMin = saturationRange[0],
      sMax = saturationRange[1];

  switch (options.luminosity) {

    case 'bright':
      sMin = 55;
      break;

    case 'dark':
      sMin = sMax - 10;
      break;

    case 'light':
      sMax = 55;
      break;
 }

  return randomWithin([sMin, sMax]);

}

const selectBrightness = (H, S, options) => {

  let bMin = getMinimumBrightness(H, S),
      bMax = 100;

  switch (options.luminosity) {

    case 'dark':
      bMax = bMin + 20;
      break;

    case 'light':
      bMin = (bMax + bMin)/2;
      break;

    case 'random':
      bMin = 0;
      bMax = 100;
      break;
  }

  return randomWithin([bMin, bMax]);
}

const setFormat = (hsv, options) => {

  switch (options.format) {

    case 'hsletray':
      return hsv;

    case 'hslArray':
      return HSVtoHSL(hsv);

    case 'hsl':
      let hsl = HSVtoHSL(hsv);
      return 'hsl('+hsl[0]+', '+hsl[1]+'%, '+hsl[2]+'%)';

    case 'hsla':
      let hslColour = HSVtoHSL(hsv);
      var alpha = options.alpha || Math.random();
      return 'hsla('+hslColour[0]+', '+hslColour[1]+'%, '+hslColour[2]+'%, ' + alpha + ')';

    case 'rgbArray':
      return HSVtoRGB(hsv);

    case 'rgb':
      let rgb = HSVtoRGB(hsv);
      return 'rgb(' + rgb.join(', ') + ')';

    case 'rgba':
      let rgbColour = HSVtoRGB(hsv);
      var alpha = options.alpha || Math.random();
      return 'rgba(' + rgbColour.join(', ') + ', ' + alpha + ')';

    default:
      return HSVtoHex(hsv);
  }

}

const getMinimumBrightness = (H, S) => {

  let lowerBounds = getColourInfo(H).lowerBounds;

  for (let i = 0; i < lowerBounds.length - 1; i++) {

    let s1 = lowerBounds[i][0],
        v1 = lowerBounds[i][1];

    let s2 = lowerBounds[i+1][0],
        v2 = lowerBounds[i+1][1];

    if (S >= s1 && S <= s2) {

       let m = (v2 - v1)/(s2 - s1),
           b = v1 - m*s1;

       return m*S + b;
    }

  }

  return 0;
}

const getHueRange = (colourInput) => {

  if (typeof parseInt(colourInput) === 'number') {

    let number = parseInt(colourInput);

    if (number < 360 && number > 0) {
      return [number, number];
    }

  }

  if (typeof colourInput === 'string') {

    if (colourDict[colourInput]) {
      let colour = colourDict[colourInput];
      if (colour.hueRange) {return colour.hueRange;}
    } else if (colourInput.match(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i)) {
      let hue = HexToHSB(colourInput)[0];
      return [ hue, hue ];
    }
  }

  return [0,360];

}

const getSaturationRange = (hue) => {
  return getColourInfo(hue).saturationRange;
}

const getColourInfo = (hue) => {

  if (hue >= 334 && hue <= 360) {
    hue-= 360;
  }

  for (let colourName in colourDict) {
     let colour = colourDict[colourName];
     if (colour.hueRange &&
         hue >= colour.hueRange[0] &&
         hue <= colour.hueRange[1]) {
        return colourDict[colourName];
     }
  } return 'Colour not found';
}

const randomWithin = (range) => {
  if (initial === null) {
    let golden_ratio = 0.618033988749895
    let r=Math.random()
    r += golden_ratio
    r %= 1
    return Math.floor(range[0] + r*(range[1] + 1 - range[0]));
  } else {
    let max = range[1] || 1;
    let min = range[0] || 0;
    initial = (initial * 9301 + 49297) % 233280;
    let rnd = initial / 233280.0;
    return Math.floor(min + rnd * (max - min));
}
}

const HSVtoHex = (hsv) => {

  let rgb = HSVtoRGB(hsv);

  const componentToHex = (c) => {
      let hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
  }

  let hex = '#' + componentToHex(rgb[0]) + componentToHex(rgb[1]) + componentToHex(rgb[2]);

  return hex;

}

const defineColour = (name, hueRange, lowerBounds) => {

  let sMin = lowerBounds[0][0],
      sMax = lowerBounds[lowerBounds.length - 1][0],

      bMin = lowerBounds[lowerBounds.length - 1][1],
      bMax = lowerBounds[0][1];

  colourDict[name] = {
    hueRange: hueRange,
    lowerBounds: lowerBounds,
    saturationRange: [sMin, sMax],
    brightnessRange: [bMin, bMax]
  };

}

const loadColourBounds = () => {

  defineColour(
    'monochrome',
    null,
    [[0,0],[100,0]]
  );

  defineColour(
    'red',
    [-26,18],
    [[20,100],[30,92],[40,89],[50,85],[60,78],[70,70],[80,60],[90,55],[100,50]]
  );

  defineColour(
    'orange',
    [18,46],
    [[20,100],[30,93],[40,88],[50,86],[60,85],[70,70],[100,70]]
  );

  defineColour(
    'yellow',
    [46,62],
    [[25,100],[40,94],[50,89],[60,86],[70,84],[80,82],[90,80],[100,75]]
  );

  defineColour(
    'green',
    [62,178],
    [[30,100],[40,90],[50,85],[60,81],[70,74],[80,64],[90,50],[100,40]]
  );

  defineColour(
    'blue',
    [178, 257],
    [[20,100],[30,86],[40,80],[50,74],[60,60],[70,52],[80,44],[90,39],[100,35]]
  );

  defineColour(
    'purple',
    [257, 282],
    [[20,100],[30,87],[40,79],[50,70],[60,65],[70,59],[80,52],[90,45],[100,42]]
  );

  defineColour(
    'pink',
    [282, 334],
    [[20,100],[30,90],[40,86],[60,84],[80,80],[90,75],[100,73]]
  );

}

const HSVtoRGB = (hsv) => {

  let h = hsv[0];
  if (h === 0) {h = 1;}
  if (h === 360) {h = 359;}

  h = h/360;
  let s = hsv[1]/100,
      v = hsv[2]/100;

  let h_i = Math.floor(h*6),
    f = h * 6 - h_i,
    p = v * (1 - s),
    q = v * (1 - f*s),
    t = v * (1 - (1 - f)*s),
    r = 256,
    g = 256,
    b = 256;

  switch(h_i) {
    case 0: r = v; g = t; b = p;  break;
    case 1: r = q; g = v; b = p;  break;
    case 2: r = p; g = v; b = t;  break;
    case 3: r = p; g = q; b = v;  break;
    case 4: r = t; g = p; b = v;  break;
    case 5: r = v; g = p; b = q;  break;
  }

  let result = [Math.floor(r*255), Math.floor(g*255), Math.floor(b*255)];
  return result;
}

const HexToHSB = (hex) => {
  hex = hex.replace(/^#/, '');
  hex = hex.length === 3 ? hex.replace(/(.)/g, '$1$1') : hex;

  let red = parseInt(hex.substr(0, 2), 16) / 255,
        green = parseInt(hex.substr(2, 2), 16) / 255,
        blue = parseInt(hex.substr(4, 2), 16) / 255;

  let cMax = Math.max(red, green, blue),
        delta = cMax - Math.min(red, green, blue),
        saturation = cMax ? (delta / cMax) : 0;

  switch (cMax) {
    case red: return [ 60 * (((green - blue) / delta) % 6) || 0, saturation, cMax ];
    case green: return [ 60 * (((blue - red) / delta) + 2) || 0, saturation, cMax ];
    case blue: return [ 60 * (((red - green) / delta) + 4) || 0, saturation, cMax ];
  }
}

const HSVtoHSL = (hsv) => {
  let h = hsv[0],
    s = hsv[1]/100,
    v = hsv[2]/100,
    k = (2-s)*v;

  return [
    h,
    Math.round(s*v / (k<1 ? k : 2-k) * 10000) / 100,
    k/2 * 100
  ];
}

const stringToInteger = (string) => {
  let total = 0
  for (let i = 0; i !== string.length; i++) {
    if (total >= Number.MAX_SAFE_INTEGER) break;
    total += string.charCodeAt(i)
  }
  return total
}

// get The range of given hue when options.count!=0
const getRealHueRange = (colourHue) => {
  if (!isNaN(colourHue)) {
    let number = parseInt(colourHue);

    if (number < 360 && number > 0) {
      return getColourInfo(colourHue).hueRange
    }
  } else if (typeof colourHue === 'string') {

    if (colourDict[colourHue]) {
      let colour = colourDict[colourHue];

      if (colour.hueRange) {
        return colour.hueRange
      }
    } else if (colourHue.match(/^#?([0-9A-F]{3}|[0-9A-F]{6})$/i)) {
      let hue = HexToHSB(colourHue)[0]
      return getColourInfo(hue).hueRange
    }
  }
}
