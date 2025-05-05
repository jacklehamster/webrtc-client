var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// ../node_modules/qrcode/lib/can-promise.js
var require_can_promise = __commonJS((exports, module) => {
  module.exports = function() {
    return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
  };
});

// ../node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS((exports) => {
  var toSJISFunction;
  var CODEWORDS_COUNT = [
    0,
    26,
    44,
    70,
    100,
    134,
    172,
    196,
    242,
    292,
    346,
    404,
    466,
    532,
    581,
    655,
    733,
    815,
    901,
    991,
    1085,
    1156,
    1258,
    1364,
    1474,
    1588,
    1706,
    1828,
    1921,
    2051,
    2185,
    2323,
    2465,
    2611,
    2761,
    2876,
    3034,
    3196,
    3362,
    3532,
    3706
  ];
  exports.getSymbolSize = function getSymbolSize(version) {
    if (!version)
      throw new Error('"version" cannot be null or undefined');
    if (version < 1 || version > 40)
      throw new Error('"version" should be in range from 1 to 40');
    return version * 4 + 17;
  };
  exports.getSymbolTotalCodewords = function getSymbolTotalCodewords(version) {
    return CODEWORDS_COUNT[version];
  };
  exports.getBCHDigit = function(data) {
    let digit = 0;
    while (data !== 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  };
  exports.setToSJISFunction = function setToSJISFunction(f) {
    if (typeof f !== "function") {
      throw new Error('"toSJISFunc" is not a valid function.');
    }
    toSJISFunction = f;
  };
  exports.isKanjiModeEnabled = function() {
    return typeof toSJISFunction !== "undefined";
  };
  exports.toSJIS = function toSJIS(kanji) {
    return toSJISFunction(kanji);
  };
});

// ../node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS((exports) => {
  exports.L = { bit: 1 };
  exports.M = { bit: 0 };
  exports.Q = { bit: 3 };
  exports.H = { bit: 2 };
  function fromString(string) {
    if (typeof string !== "string") {
      throw new Error("Param is not a string");
    }
    const lcStr = string.toLowerCase();
    switch (lcStr) {
      case "l":
      case "low":
        return exports.L;
      case "m":
      case "medium":
        return exports.M;
      case "q":
      case "quartile":
        return exports.Q;
      case "h":
      case "high":
        return exports.H;
      default:
        throw new Error("Unknown EC Level: " + string);
    }
  }
  exports.isValid = function isValid(level) {
    return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
  };
  exports.from = function from(value, defaultValue) {
    if (exports.isValid(value)) {
      return value;
    }
    try {
      return fromString(value);
    } catch (e) {
      return defaultValue;
    }
  };
});

// ../node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS((exports, module) => {
  function BitBuffer() {
    this.buffer = [];
    this.length = 0;
  }
  BitBuffer.prototype = {
    get: function(index) {
      const bufIndex = Math.floor(index / 8);
      return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
    },
    put: function(num, length) {
      for (let i = 0;i < length; i++) {
        this.putBit((num >>> length - i - 1 & 1) === 1);
      }
    },
    getLengthInBits: function() {
      return this.length;
    },
    putBit: function(bit) {
      const bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) {
        this.buffer.push(0);
      }
      if (bit) {
        this.buffer[bufIndex] |= 128 >>> this.length % 8;
      }
      this.length++;
    }
  };
  module.exports = BitBuffer;
});

// ../node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS((exports, module) => {
  function BitMatrix(size) {
    if (!size || size < 1) {
      throw new Error("BitMatrix size must be defined and greater than 0");
    }
    this.size = size;
    this.data = new Uint8Array(size * size);
    this.reservedBit = new Uint8Array(size * size);
  }
  BitMatrix.prototype.set = function(row, col, value, reserved) {
    const index = row * this.size + col;
    this.data[index] = value;
    if (reserved)
      this.reservedBit[index] = true;
  };
  BitMatrix.prototype.get = function(row, col) {
    return this.data[row * this.size + col];
  };
  BitMatrix.prototype.xor = function(row, col, value) {
    this.data[row * this.size + col] ^= value;
  };
  BitMatrix.prototype.isReserved = function(row, col) {
    return this.reservedBit[row * this.size + col];
  };
  module.exports = BitMatrix;
});

// ../node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS((exports) => {
  var getSymbolSize = require_utils().getSymbolSize;
  exports.getRowColCoords = function getRowColCoords(version) {
    if (version === 1)
      return [];
    const posCount = Math.floor(version / 7) + 2;
    const size = getSymbolSize(version);
    const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
    const positions = [size - 7];
    for (let i = 1;i < posCount - 1; i++) {
      positions[i] = positions[i - 1] - intervals;
    }
    positions.push(6);
    return positions.reverse();
  };
  exports.getPositions = function getPositions(version) {
    const coords = [];
    const pos = exports.getRowColCoords(version);
    const posLength = pos.length;
    for (let i = 0;i < posLength; i++) {
      for (let j = 0;j < posLength; j++) {
        if (i === 0 && j === 0 || i === 0 && j === posLength - 1 || i === posLength - 1 && j === 0) {
          continue;
        }
        coords.push([pos[i], pos[j]]);
      }
    }
    return coords;
  };
});

// ../node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS((exports) => {
  var getSymbolSize = require_utils().getSymbolSize;
  var FINDER_PATTERN_SIZE = 7;
  exports.getPositions = function getPositions(version) {
    const size = getSymbolSize(version);
    return [
      [0, 0],
      [size - FINDER_PATTERN_SIZE, 0],
      [0, size - FINDER_PATTERN_SIZE]
    ];
  };
});

// ../node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS((exports) => {
  exports.Patterns = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  };
  var PenaltyScores = {
    N1: 3,
    N2: 3,
    N3: 40,
    N4: 10
  };
  exports.isValid = function isValid(mask) {
    return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
  };
  exports.from = function from(value) {
    return exports.isValid(value) ? parseInt(value, 10) : undefined;
  };
  exports.getPenaltyN1 = function getPenaltyN1(data) {
    const size = data.size;
    let points = 0;
    let sameCountCol = 0;
    let sameCountRow = 0;
    let lastCol = null;
    let lastRow = null;
    for (let row = 0;row < size; row++) {
      sameCountCol = sameCountRow = 0;
      lastCol = lastRow = null;
      for (let col = 0;col < size; col++) {
        let module2 = data.get(row, col);
        if (module2 === lastCol) {
          sameCountCol++;
        } else {
          if (sameCountCol >= 5)
            points += PenaltyScores.N1 + (sameCountCol - 5);
          lastCol = module2;
          sameCountCol = 1;
        }
        module2 = data.get(col, row);
        if (module2 === lastRow) {
          sameCountRow++;
        } else {
          if (sameCountRow >= 5)
            points += PenaltyScores.N1 + (sameCountRow - 5);
          lastRow = module2;
          sameCountRow = 1;
        }
      }
      if (sameCountCol >= 5)
        points += PenaltyScores.N1 + (sameCountCol - 5);
      if (sameCountRow >= 5)
        points += PenaltyScores.N1 + (sameCountRow - 5);
    }
    return points;
  };
  exports.getPenaltyN2 = function getPenaltyN2(data) {
    const size = data.size;
    let points = 0;
    for (let row = 0;row < size - 1; row++) {
      for (let col = 0;col < size - 1; col++) {
        const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
        if (last === 4 || last === 0)
          points++;
      }
    }
    return points * PenaltyScores.N2;
  };
  exports.getPenaltyN3 = function getPenaltyN3(data) {
    const size = data.size;
    let points = 0;
    let bitsCol = 0;
    let bitsRow = 0;
    for (let row = 0;row < size; row++) {
      bitsCol = bitsRow = 0;
      for (let col = 0;col < size; col++) {
        bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
        if (col >= 10 && (bitsCol === 1488 || bitsCol === 93))
          points++;
        bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
        if (col >= 10 && (bitsRow === 1488 || bitsRow === 93))
          points++;
      }
    }
    return points * PenaltyScores.N3;
  };
  exports.getPenaltyN4 = function getPenaltyN4(data) {
    let darkCount = 0;
    const modulesCount = data.data.length;
    for (let i = 0;i < modulesCount; i++)
      darkCount += data.data[i];
    const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
    return k * PenaltyScores.N4;
  };
  function getMaskAt(maskPattern, i, j) {
    switch (maskPattern) {
      case exports.Patterns.PATTERN000:
        return (i + j) % 2 === 0;
      case exports.Patterns.PATTERN001:
        return i % 2 === 0;
      case exports.Patterns.PATTERN010:
        return j % 3 === 0;
      case exports.Patterns.PATTERN011:
        return (i + j) % 3 === 0;
      case exports.Patterns.PATTERN100:
        return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case exports.Patterns.PATTERN101:
        return i * j % 2 + i * j % 3 === 0;
      case exports.Patterns.PATTERN110:
        return (i * j % 2 + i * j % 3) % 2 === 0;
      case exports.Patterns.PATTERN111:
        return (i * j % 3 + (i + j) % 2) % 2 === 0;
      default:
        throw new Error("bad maskPattern:" + maskPattern);
    }
  }
  exports.applyMask = function applyMask(pattern, data) {
    const size = data.size;
    for (let col = 0;col < size; col++) {
      for (let row = 0;row < size; row++) {
        if (data.isReserved(row, col))
          continue;
        data.xor(row, col, getMaskAt(pattern, row, col));
      }
    }
  };
  exports.getBestMask = function getBestMask(data, setupFormatFunc) {
    const numPatterns = Object.keys(exports.Patterns).length;
    let bestPattern = 0;
    let lowerPenalty = Infinity;
    for (let p = 0;p < numPatterns; p++) {
      setupFormatFunc(p);
      exports.applyMask(p, data);
      const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
      exports.applyMask(p, data);
      if (penalty < lowerPenalty) {
        lowerPenalty = penalty;
        bestPattern = p;
      }
    }
    return bestPattern;
  };
});

// ../node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS((exports) => {
  var ECLevel = require_error_correction_level();
  var EC_BLOCKS_TABLE = [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    2,
    2,
    1,
    2,
    2,
    4,
    1,
    2,
    4,
    4,
    2,
    4,
    4,
    4,
    2,
    4,
    6,
    5,
    2,
    4,
    6,
    6,
    2,
    5,
    8,
    8,
    4,
    5,
    8,
    8,
    4,
    5,
    8,
    11,
    4,
    8,
    10,
    11,
    4,
    9,
    12,
    16,
    4,
    9,
    16,
    16,
    6,
    10,
    12,
    18,
    6,
    10,
    17,
    16,
    6,
    11,
    16,
    19,
    6,
    13,
    18,
    21,
    7,
    14,
    21,
    25,
    8,
    16,
    20,
    25,
    8,
    17,
    23,
    25,
    9,
    17,
    23,
    34,
    9,
    18,
    25,
    30,
    10,
    20,
    27,
    32,
    12,
    21,
    29,
    35,
    12,
    23,
    34,
    37,
    12,
    25,
    34,
    40,
    13,
    26,
    35,
    42,
    14,
    28,
    38,
    45,
    15,
    29,
    40,
    48,
    16,
    31,
    43,
    51,
    17,
    33,
    45,
    54,
    18,
    35,
    48,
    57,
    19,
    37,
    51,
    60,
    19,
    38,
    53,
    63,
    20,
    40,
    56,
    66,
    21,
    43,
    59,
    70,
    22,
    45,
    62,
    74,
    24,
    47,
    65,
    77,
    25,
    49,
    68,
    81
  ];
  var EC_CODEWORDS_TABLE = [
    7,
    10,
    13,
    17,
    10,
    16,
    22,
    28,
    15,
    26,
    36,
    44,
    20,
    36,
    52,
    64,
    26,
    48,
    72,
    88,
    36,
    64,
    96,
    112,
    40,
    72,
    108,
    130,
    48,
    88,
    132,
    156,
    60,
    110,
    160,
    192,
    72,
    130,
    192,
    224,
    80,
    150,
    224,
    264,
    96,
    176,
    260,
    308,
    104,
    198,
    288,
    352,
    120,
    216,
    320,
    384,
    132,
    240,
    360,
    432,
    144,
    280,
    408,
    480,
    168,
    308,
    448,
    532,
    180,
    338,
    504,
    588,
    196,
    364,
    546,
    650,
    224,
    416,
    600,
    700,
    224,
    442,
    644,
    750,
    252,
    476,
    690,
    816,
    270,
    504,
    750,
    900,
    300,
    560,
    810,
    960,
    312,
    588,
    870,
    1050,
    336,
    644,
    952,
    1110,
    360,
    700,
    1020,
    1200,
    390,
    728,
    1050,
    1260,
    420,
    784,
    1140,
    1350,
    450,
    812,
    1200,
    1440,
    480,
    868,
    1290,
    1530,
    510,
    924,
    1350,
    1620,
    540,
    980,
    1440,
    1710,
    570,
    1036,
    1530,
    1800,
    570,
    1064,
    1590,
    1890,
    600,
    1120,
    1680,
    1980,
    630,
    1204,
    1770,
    2100,
    660,
    1260,
    1860,
    2220,
    720,
    1316,
    1950,
    2310,
    750,
    1372,
    2040,
    2430
  ];
  exports.getBlocksCount = function getBlocksCount(version, errorCorrectionLevel) {
    switch (errorCorrectionLevel) {
      case ECLevel.L:
        return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
      case ECLevel.M:
        return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
      case ECLevel.Q:
        return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
      case ECLevel.H:
        return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
      default:
        return;
    }
  };
  exports.getTotalCodewordsCount = function getTotalCodewordsCount(version, errorCorrectionLevel) {
    switch (errorCorrectionLevel) {
      case ECLevel.L:
        return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
      case ECLevel.M:
        return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
      case ECLevel.Q:
        return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
      case ECLevel.H:
        return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
      default:
        return;
    }
  };
});

// ../node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS((exports) => {
  var EXP_TABLE = new Uint8Array(512);
  var LOG_TABLE = new Uint8Array(256);
  (function initTables() {
    let x = 1;
    for (let i = 0;i < 255; i++) {
      EXP_TABLE[i] = x;
      LOG_TABLE[x] = i;
      x <<= 1;
      if (x & 256) {
        x ^= 285;
      }
    }
    for (let i = 255;i < 512; i++) {
      EXP_TABLE[i] = EXP_TABLE[i - 255];
    }
  })();
  exports.log = function log(n) {
    if (n < 1)
      throw new Error("log(" + n + ")");
    return LOG_TABLE[n];
  };
  exports.exp = function exp(n) {
    return EXP_TABLE[n];
  };
  exports.mul = function mul(x, y) {
    if (x === 0 || y === 0)
      return 0;
    return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
  };
});

// ../node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS((exports) => {
  var GF = require_galois_field();
  exports.mul = function mul(p1, p2) {
    const coeff = new Uint8Array(p1.length + p2.length - 1);
    for (let i = 0;i < p1.length; i++) {
      for (let j = 0;j < p2.length; j++) {
        coeff[i + j] ^= GF.mul(p1[i], p2[j]);
      }
    }
    return coeff;
  };
  exports.mod = function mod(divident, divisor) {
    let result = new Uint8Array(divident);
    while (result.length - divisor.length >= 0) {
      const coeff = result[0];
      for (let i = 0;i < divisor.length; i++) {
        result[i] ^= GF.mul(divisor[i], coeff);
      }
      let offset = 0;
      while (offset < result.length && result[offset] === 0)
        offset++;
      result = result.slice(offset);
    }
    return result;
  };
  exports.generateECPolynomial = function generateECPolynomial(degree) {
    let poly = new Uint8Array([1]);
    for (let i = 0;i < degree; i++) {
      poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
    }
    return poly;
  };
});

// ../node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS((exports, module) => {
  var Polynomial = require_polynomial();
  function ReedSolomonEncoder(degree) {
    this.genPoly = undefined;
    this.degree = degree;
    if (this.degree)
      this.initialize(this.degree);
  }
  ReedSolomonEncoder.prototype.initialize = function initialize(degree) {
    this.degree = degree;
    this.genPoly = Polynomial.generateECPolynomial(this.degree);
  };
  ReedSolomonEncoder.prototype.encode = function encode(data) {
    if (!this.genPoly) {
      throw new Error("Encoder not initialized");
    }
    const paddedData = new Uint8Array(data.length + this.degree);
    paddedData.set(data);
    const remainder = Polynomial.mod(paddedData, this.genPoly);
    const start = this.degree - remainder.length;
    if (start > 0) {
      const buff = new Uint8Array(this.degree);
      buff.set(remainder, start);
      return buff;
    }
    return remainder;
  };
  module.exports = ReedSolomonEncoder;
});

// ../node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS((exports) => {
  exports.isValid = function isValid(version) {
    return !isNaN(version) && version >= 1 && version <= 40;
  };
});

// ../node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS((exports) => {
  var numeric = "[0-9]+";
  var alphanumeric = "[A-Z $%*+\\-./:]+";
  var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|" + "[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|" + "[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|" + "[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
  kanji = kanji.replace(/u/g, "\\u");
  var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + `)(?:.|[\r
]))+`;
  exports.KANJI = new RegExp(kanji, "g");
  exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
  exports.BYTE = new RegExp(byte, "g");
  exports.NUMERIC = new RegExp(numeric, "g");
  exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
  var TEST_KANJI = new RegExp("^" + kanji + "$");
  var TEST_NUMERIC = new RegExp("^" + numeric + "$");
  var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
  exports.testKanji = function testKanji(str) {
    return TEST_KANJI.test(str);
  };
  exports.testNumeric = function testNumeric(str) {
    return TEST_NUMERIC.test(str);
  };
  exports.testAlphanumeric = function testAlphanumeric(str) {
    return TEST_ALPHANUMERIC.test(str);
  };
});

// ../node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS((exports) => {
  var VersionCheck = require_version_check();
  var Regex = require_regex();
  exports.NUMERIC = {
    id: "Numeric",
    bit: 1 << 0,
    ccBits: [10, 12, 14]
  };
  exports.ALPHANUMERIC = {
    id: "Alphanumeric",
    bit: 1 << 1,
    ccBits: [9, 11, 13]
  };
  exports.BYTE = {
    id: "Byte",
    bit: 1 << 2,
    ccBits: [8, 16, 16]
  };
  exports.KANJI = {
    id: "Kanji",
    bit: 1 << 3,
    ccBits: [8, 10, 12]
  };
  exports.MIXED = {
    bit: -1
  };
  exports.getCharCountIndicator = function getCharCountIndicator(mode, version) {
    if (!mode.ccBits)
      throw new Error("Invalid mode: " + mode);
    if (!VersionCheck.isValid(version)) {
      throw new Error("Invalid version: " + version);
    }
    if (version >= 1 && version < 10)
      return mode.ccBits[0];
    else if (version < 27)
      return mode.ccBits[1];
    return mode.ccBits[2];
  };
  exports.getBestModeForData = function getBestModeForData(dataStr) {
    if (Regex.testNumeric(dataStr))
      return exports.NUMERIC;
    else if (Regex.testAlphanumeric(dataStr))
      return exports.ALPHANUMERIC;
    else if (Regex.testKanji(dataStr))
      return exports.KANJI;
    else
      return exports.BYTE;
  };
  exports.toString = function toString(mode) {
    if (mode && mode.id)
      return mode.id;
    throw new Error("Invalid mode");
  };
  exports.isValid = function isValid(mode) {
    return mode && mode.bit && mode.ccBits;
  };
  function fromString(string) {
    if (typeof string !== "string") {
      throw new Error("Param is not a string");
    }
    const lcStr = string.toLowerCase();
    switch (lcStr) {
      case "numeric":
        return exports.NUMERIC;
      case "alphanumeric":
        return exports.ALPHANUMERIC;
      case "kanji":
        return exports.KANJI;
      case "byte":
        return exports.BYTE;
      default:
        throw new Error("Unknown mode: " + string);
    }
  }
  exports.from = function from(value, defaultValue) {
    if (exports.isValid(value)) {
      return value;
    }
    try {
      return fromString(value);
    } catch (e) {
      return defaultValue;
    }
  };
});

// ../node_modules/qrcode/lib/core/version.js
var require_version = __commonJS((exports) => {
  var Utils = require_utils();
  var ECCode = require_error_correction_code();
  var ECLevel = require_error_correction_level();
  var Mode = require_mode();
  var VersionCheck = require_version_check();
  var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
  var G18_BCH = Utils.getBCHDigit(G18);
  function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
    for (let currentVersion = 1;currentVersion <= 40; currentVersion++) {
      if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
        return currentVersion;
      }
    }
    return;
  }
  function getReservedBitsCount(mode, version) {
    return Mode.getCharCountIndicator(mode, version) + 4;
  }
  function getTotalBitsFromDataArray(segments, version) {
    let totalBits = 0;
    segments.forEach(function(data) {
      const reservedBits = getReservedBitsCount(data.mode, version);
      totalBits += reservedBits + data.getBitsLength();
    });
    return totalBits;
  }
  function getBestVersionForMixedData(segments, errorCorrectionLevel) {
    for (let currentVersion = 1;currentVersion <= 40; currentVersion++) {
      const length = getTotalBitsFromDataArray(segments, currentVersion);
      if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
        return currentVersion;
      }
    }
    return;
  }
  exports.from = function from(value, defaultValue) {
    if (VersionCheck.isValid(value)) {
      return parseInt(value, 10);
    }
    return defaultValue;
  };
  exports.getCapacity = function getCapacity(version, errorCorrectionLevel, mode) {
    if (!VersionCheck.isValid(version)) {
      throw new Error("Invalid QR Code version");
    }
    if (typeof mode === "undefined")
      mode = Mode.BYTE;
    const totalCodewords = Utils.getSymbolTotalCodewords(version);
    const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
    const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
    if (mode === Mode.MIXED)
      return dataTotalCodewordsBits;
    const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
    switch (mode) {
      case Mode.NUMERIC:
        return Math.floor(usableBits / 10 * 3);
      case Mode.ALPHANUMERIC:
        return Math.floor(usableBits / 11 * 2);
      case Mode.KANJI:
        return Math.floor(usableBits / 13);
      case Mode.BYTE:
      default:
        return Math.floor(usableBits / 8);
    }
  };
  exports.getBestVersionForData = function getBestVersionForData(data, errorCorrectionLevel) {
    let seg;
    const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
    if (Array.isArray(data)) {
      if (data.length > 1) {
        return getBestVersionForMixedData(data, ecl);
      }
      if (data.length === 0) {
        return 1;
      }
      seg = data[0];
    } else {
      seg = data;
    }
    return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
  };
  exports.getEncodedBits = function getEncodedBits(version) {
    if (!VersionCheck.isValid(version) || version < 7) {
      throw new Error("Invalid QR Code version");
    }
    let d = version << 12;
    while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
      d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
    }
    return version << 12 | d;
  };
});

// ../node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS((exports) => {
  var Utils = require_utils();
  var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
  var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
  var G15_BCH = Utils.getBCHDigit(G15);
  exports.getEncodedBits = function getEncodedBits(errorCorrectionLevel, mask) {
    const data = errorCorrectionLevel.bit << 3 | mask;
    let d = data << 10;
    while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
      d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
    }
    return (data << 10 | d) ^ G15_MASK;
  };
});

// ../node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS((exports, module) => {
  var Mode = require_mode();
  function NumericData(data) {
    this.mode = Mode.NUMERIC;
    this.data = data.toString();
  }
  NumericData.getBitsLength = function getBitsLength(length) {
    return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
  };
  NumericData.prototype.getLength = function getLength() {
    return this.data.length;
  };
  NumericData.prototype.getBitsLength = function getBitsLength() {
    return NumericData.getBitsLength(this.data.length);
  };
  NumericData.prototype.write = function write(bitBuffer) {
    let i, group, value;
    for (i = 0;i + 3 <= this.data.length; i += 3) {
      group = this.data.substr(i, 3);
      value = parseInt(group, 10);
      bitBuffer.put(value, 10);
    }
    const remainingNum = this.data.length - i;
    if (remainingNum > 0) {
      group = this.data.substr(i);
      value = parseInt(group, 10);
      bitBuffer.put(value, remainingNum * 3 + 1);
    }
  };
  module.exports = NumericData;
});

// ../node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS((exports, module) => {
  var Mode = require_mode();
  var ALPHA_NUM_CHARS = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    " ",
    "$",
    "%",
    "*",
    "+",
    "-",
    ".",
    "/",
    ":"
  ];
  function AlphanumericData(data) {
    this.mode = Mode.ALPHANUMERIC;
    this.data = data;
  }
  AlphanumericData.getBitsLength = function getBitsLength(length) {
    return 11 * Math.floor(length / 2) + 6 * (length % 2);
  };
  AlphanumericData.prototype.getLength = function getLength() {
    return this.data.length;
  };
  AlphanumericData.prototype.getBitsLength = function getBitsLength() {
    return AlphanumericData.getBitsLength(this.data.length);
  };
  AlphanumericData.prototype.write = function write(bitBuffer) {
    let i;
    for (i = 0;i + 2 <= this.data.length; i += 2) {
      let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
      value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
      bitBuffer.put(value, 11);
    }
    if (this.data.length % 2) {
      bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
    }
  };
  module.exports = AlphanumericData;
});

// ../node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS((exports, module) => {
  var Mode = require_mode();
  function ByteData(data) {
    this.mode = Mode.BYTE;
    if (typeof data === "string") {
      this.data = new TextEncoder().encode(data);
    } else {
      this.data = new Uint8Array(data);
    }
  }
  ByteData.getBitsLength = function getBitsLength(length) {
    return length * 8;
  };
  ByteData.prototype.getLength = function getLength() {
    return this.data.length;
  };
  ByteData.prototype.getBitsLength = function getBitsLength() {
    return ByteData.getBitsLength(this.data.length);
  };
  ByteData.prototype.write = function(bitBuffer) {
    for (let i = 0, l = this.data.length;i < l; i++) {
      bitBuffer.put(this.data[i], 8);
    }
  };
  module.exports = ByteData;
});

// ../node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS((exports, module) => {
  var Mode = require_mode();
  var Utils = require_utils();
  function KanjiData(data) {
    this.mode = Mode.KANJI;
    this.data = data;
  }
  KanjiData.getBitsLength = function getBitsLength(length) {
    return length * 13;
  };
  KanjiData.prototype.getLength = function getLength() {
    return this.data.length;
  };
  KanjiData.prototype.getBitsLength = function getBitsLength() {
    return KanjiData.getBitsLength(this.data.length);
  };
  KanjiData.prototype.write = function(bitBuffer) {
    let i;
    for (i = 0;i < this.data.length; i++) {
      let value = Utils.toSJIS(this.data[i]);
      if (value >= 33088 && value <= 40956) {
        value -= 33088;
      } else if (value >= 57408 && value <= 60351) {
        value -= 49472;
      } else {
        throw new Error("Invalid SJIS character: " + this.data[i] + `
` + "Make sure your charset is UTF-8");
      }
      value = (value >>> 8 & 255) * 192 + (value & 255);
      bitBuffer.put(value, 13);
    }
  };
  module.exports = KanjiData;
});

// ../node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS((exports, module) => {
  var dijkstra = {
    single_source_shortest_paths: function(graph, s, d) {
      var predecessors = {};
      var costs = {};
      costs[s] = 0;
      var open = dijkstra.PriorityQueue.make();
      open.push(s, 0);
      var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
      while (!open.empty()) {
        closest = open.pop();
        u = closest.value;
        cost_of_s_to_u = closest.cost;
        adjacent_nodes = graph[u] || {};
        for (v in adjacent_nodes) {
          if (adjacent_nodes.hasOwnProperty(v)) {
            cost_of_e = adjacent_nodes[v];
            cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
            cost_of_s_to_v = costs[v];
            first_visit = typeof costs[v] === "undefined";
            if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
              costs[v] = cost_of_s_to_u_plus_cost_of_e;
              open.push(v, cost_of_s_to_u_plus_cost_of_e);
              predecessors[v] = u;
            }
          }
        }
      }
      if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
        var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
        throw new Error(msg);
      }
      return predecessors;
    },
    extract_shortest_path_from_predecessor_list: function(predecessors, d) {
      var nodes = [];
      var u = d;
      var predecessor;
      while (u) {
        nodes.push(u);
        predecessor = predecessors[u];
        u = predecessors[u];
      }
      nodes.reverse();
      return nodes;
    },
    find_path: function(graph, s, d) {
      var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
      return dijkstra.extract_shortest_path_from_predecessor_list(predecessors, d);
    },
    PriorityQueue: {
      make: function(opts) {
        var T = dijkstra.PriorityQueue, t = {}, key;
        opts = opts || {};
        for (key in T) {
          if (T.hasOwnProperty(key)) {
            t[key] = T[key];
          }
        }
        t.queue = [];
        t.sorter = opts.sorter || T.default_sorter;
        return t;
      },
      default_sorter: function(a, b) {
        return a.cost - b.cost;
      },
      push: function(value, cost) {
        var item = { value, cost };
        this.queue.push(item);
        this.queue.sort(this.sorter);
      },
      pop: function() {
        return this.queue.shift();
      },
      empty: function() {
        return this.queue.length === 0;
      }
    }
  };
  if (typeof module !== "undefined") {
    module.exports = dijkstra;
  }
});

// ../node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS((exports) => {
  var Mode = require_mode();
  var NumericData = require_numeric_data();
  var AlphanumericData = require_alphanumeric_data();
  var ByteData = require_byte_data();
  var KanjiData = require_kanji_data();
  var Regex = require_regex();
  var Utils = require_utils();
  var dijkstra = require_dijkstra();
  function getStringByteLength(str) {
    return unescape(encodeURIComponent(str)).length;
  }
  function getSegments(regex, mode, str) {
    const segments = [];
    let result;
    while ((result = regex.exec(str)) !== null) {
      segments.push({
        data: result[0],
        index: result.index,
        mode,
        length: result[0].length
      });
    }
    return segments;
  }
  function getSegmentsFromString(dataStr) {
    const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
    const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
    let byteSegs;
    let kanjiSegs;
    if (Utils.isKanjiModeEnabled()) {
      byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
      kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
    } else {
      byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
      kanjiSegs = [];
    }
    const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
    return segs.sort(function(s1, s2) {
      return s1.index - s2.index;
    }).map(function(obj) {
      return {
        data: obj.data,
        mode: obj.mode,
        length: obj.length
      };
    });
  }
  function getSegmentBitsLength(length, mode) {
    switch (mode) {
      case Mode.NUMERIC:
        return NumericData.getBitsLength(length);
      case Mode.ALPHANUMERIC:
        return AlphanumericData.getBitsLength(length);
      case Mode.KANJI:
        return KanjiData.getBitsLength(length);
      case Mode.BYTE:
        return ByteData.getBitsLength(length);
    }
  }
  function mergeSegments(segs) {
    return segs.reduce(function(acc, curr) {
      const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
      if (prevSeg && prevSeg.mode === curr.mode) {
        acc[acc.length - 1].data += curr.data;
        return acc;
      }
      acc.push(curr);
      return acc;
    }, []);
  }
  function buildNodes(segs) {
    const nodes = [];
    for (let i = 0;i < segs.length; i++) {
      const seg = segs[i];
      switch (seg.mode) {
        case Mode.NUMERIC:
          nodes.push([
            seg,
            { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
            { data: seg.data, mode: Mode.BYTE, length: seg.length }
          ]);
          break;
        case Mode.ALPHANUMERIC:
          nodes.push([
            seg,
            { data: seg.data, mode: Mode.BYTE, length: seg.length }
          ]);
          break;
        case Mode.KANJI:
          nodes.push([
            seg,
            { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
          ]);
          break;
        case Mode.BYTE:
          nodes.push([
            { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
          ]);
      }
    }
    return nodes;
  }
  function buildGraph(nodes, version) {
    const table = {};
    const graph = { start: {} };
    let prevNodeIds = ["start"];
    for (let i = 0;i < nodes.length; i++) {
      const nodeGroup = nodes[i];
      const currentNodeIds = [];
      for (let j = 0;j < nodeGroup.length; j++) {
        const node = nodeGroup[j];
        const key = "" + i + j;
        currentNodeIds.push(key);
        table[key] = { node, lastCount: 0 };
        graph[key] = {};
        for (let n = 0;n < prevNodeIds.length; n++) {
          const prevNodeId = prevNodeIds[n];
          if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
            graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
            table[prevNodeId].lastCount += node.length;
          } else {
            if (table[prevNodeId])
              table[prevNodeId].lastCount = node.length;
            graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
          }
        }
      }
      prevNodeIds = currentNodeIds;
    }
    for (let n = 0;n < prevNodeIds.length; n++) {
      graph[prevNodeIds[n]].end = 0;
    }
    return { map: graph, table };
  }
  function buildSingleSegment(data, modesHint) {
    let mode;
    const bestMode = Mode.getBestModeForData(data);
    mode = Mode.from(modesHint, bestMode);
    if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
      throw new Error('"' + data + '"' + " cannot be encoded with mode " + Mode.toString(mode) + `.
 Suggested mode is: ` + Mode.toString(bestMode));
    }
    if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
      mode = Mode.BYTE;
    }
    switch (mode) {
      case Mode.NUMERIC:
        return new NumericData(data);
      case Mode.ALPHANUMERIC:
        return new AlphanumericData(data);
      case Mode.KANJI:
        return new KanjiData(data);
      case Mode.BYTE:
        return new ByteData(data);
    }
  }
  exports.fromArray = function fromArray(array) {
    return array.reduce(function(acc, seg) {
      if (typeof seg === "string") {
        acc.push(buildSingleSegment(seg, null));
      } else if (seg.data) {
        acc.push(buildSingleSegment(seg.data, seg.mode));
      }
      return acc;
    }, []);
  };
  exports.fromString = function fromString(data, version) {
    const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
    const nodes = buildNodes(segs);
    const graph = buildGraph(nodes, version);
    const path = dijkstra.find_path(graph.map, "start", "end");
    const optimizedSegs = [];
    for (let i = 1;i < path.length - 1; i++) {
      optimizedSegs.push(graph.table[path[i]].node);
    }
    return exports.fromArray(mergeSegments(optimizedSegs));
  };
  exports.rawSplit = function rawSplit(data) {
    return exports.fromArray(getSegmentsFromString(data, Utils.isKanjiModeEnabled()));
  };
});

// ../node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS((exports) => {
  var Utils = require_utils();
  var ECLevel = require_error_correction_level();
  var BitBuffer = require_bit_buffer();
  var BitMatrix = require_bit_matrix();
  var AlignmentPattern = require_alignment_pattern();
  var FinderPattern = require_finder_pattern();
  var MaskPattern = require_mask_pattern();
  var ECCode = require_error_correction_code();
  var ReedSolomonEncoder = require_reed_solomon_encoder();
  var Version = require_version();
  var FormatInfo = require_format_info();
  var Mode = require_mode();
  var Segments = require_segments();
  function setupFinderPattern(matrix, version) {
    const size = matrix.size;
    const pos = FinderPattern.getPositions(version);
    for (let i = 0;i < pos.length; i++) {
      const row = pos[i][0];
      const col = pos[i][1];
      for (let r = -1;r <= 7; r++) {
        if (row + r <= -1 || size <= row + r)
          continue;
        for (let c = -1;c <= 7; c++) {
          if (col + c <= -1 || size <= col + c)
            continue;
          if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
            matrix.set(row + r, col + c, true, true);
          } else {
            matrix.set(row + r, col + c, false, true);
          }
        }
      }
    }
  }
  function setupTimingPattern(matrix) {
    const size = matrix.size;
    for (let r = 8;r < size - 8; r++) {
      const value = r % 2 === 0;
      matrix.set(r, 6, value, true);
      matrix.set(6, r, value, true);
    }
  }
  function setupAlignmentPattern(matrix, version) {
    const pos = AlignmentPattern.getPositions(version);
    for (let i = 0;i < pos.length; i++) {
      const row = pos[i][0];
      const col = pos[i][1];
      for (let r = -2;r <= 2; r++) {
        for (let c = -2;c <= 2; c++) {
          if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
            matrix.set(row + r, col + c, true, true);
          } else {
            matrix.set(row + r, col + c, false, true);
          }
        }
      }
    }
  }
  function setupVersionInfo(matrix, version) {
    const size = matrix.size;
    const bits = Version.getEncodedBits(version);
    let row, col, mod;
    for (let i = 0;i < 18; i++) {
      row = Math.floor(i / 3);
      col = i % 3 + size - 8 - 3;
      mod = (bits >> i & 1) === 1;
      matrix.set(row, col, mod, true);
      matrix.set(col, row, mod, true);
    }
  }
  function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
    const size = matrix.size;
    const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
    let i, mod;
    for (i = 0;i < 15; i++) {
      mod = (bits >> i & 1) === 1;
      if (i < 6) {
        matrix.set(i, 8, mod, true);
      } else if (i < 8) {
        matrix.set(i + 1, 8, mod, true);
      } else {
        matrix.set(size - 15 + i, 8, mod, true);
      }
      if (i < 8) {
        matrix.set(8, size - i - 1, mod, true);
      } else if (i < 9) {
        matrix.set(8, 15 - i - 1 + 1, mod, true);
      } else {
        matrix.set(8, 15 - i - 1, mod, true);
      }
    }
    matrix.set(size - 8, 8, 1, true);
  }
  function setupData(matrix, data) {
    const size = matrix.size;
    let inc = -1;
    let row = size - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    for (let col = size - 1;col > 0; col -= 2) {
      if (col === 6)
        col--;
      while (true) {
        for (let c = 0;c < 2; c++) {
          if (!matrix.isReserved(row, col - c)) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = (data[byteIndex] >>> bitIndex & 1) === 1;
            }
            matrix.set(row, col - c, dark);
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || size <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }
  function createData(version, errorCorrectionLevel, segments) {
    const buffer = new BitBuffer;
    segments.forEach(function(data) {
      buffer.put(data.mode.bit, 4);
      buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
      data.write(buffer);
    });
    const totalCodewords = Utils.getSymbolTotalCodewords(version);
    const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
    const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
    if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
      buffer.put(0, 4);
    }
    while (buffer.getLengthInBits() % 8 !== 0) {
      buffer.putBit(0);
    }
    const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
    for (let i = 0;i < remainingByte; i++) {
      buffer.put(i % 2 ? 17 : 236, 8);
    }
    return createCodewords(buffer, version, errorCorrectionLevel);
  }
  function createCodewords(bitBuffer, version, errorCorrectionLevel) {
    const totalCodewords = Utils.getSymbolTotalCodewords(version);
    const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
    const dataTotalCodewords = totalCodewords - ecTotalCodewords;
    const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
    const blocksInGroup2 = totalCodewords % ecTotalBlocks;
    const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
    const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
    const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
    const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
    const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
    const rs = new ReedSolomonEncoder(ecCount);
    let offset = 0;
    const dcData = new Array(ecTotalBlocks);
    const ecData = new Array(ecTotalBlocks);
    let maxDataSize = 0;
    const buffer = new Uint8Array(bitBuffer.buffer);
    for (let b = 0;b < ecTotalBlocks; b++) {
      const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
      dcData[b] = buffer.slice(offset, offset + dataSize);
      ecData[b] = rs.encode(dcData[b]);
      offset += dataSize;
      maxDataSize = Math.max(maxDataSize, dataSize);
    }
    const data = new Uint8Array(totalCodewords);
    let index = 0;
    let i, r;
    for (i = 0;i < maxDataSize; i++) {
      for (r = 0;r < ecTotalBlocks; r++) {
        if (i < dcData[r].length) {
          data[index++] = dcData[r][i];
        }
      }
    }
    for (i = 0;i < ecCount; i++) {
      for (r = 0;r < ecTotalBlocks; r++) {
        data[index++] = ecData[r][i];
      }
    }
    return data;
  }
  function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
    let segments;
    if (Array.isArray(data)) {
      segments = Segments.fromArray(data);
    } else if (typeof data === "string") {
      let estimatedVersion = version;
      if (!estimatedVersion) {
        const rawSegments = Segments.rawSplit(data);
        estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
      }
      segments = Segments.fromString(data, estimatedVersion || 40);
    } else {
      throw new Error("Invalid data");
    }
    const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
    if (!bestVersion) {
      throw new Error("The amount of data is too big to be stored in a QR Code");
    }
    if (!version) {
      version = bestVersion;
    } else if (version < bestVersion) {
      throw new Error(`
` + `The chosen QR Code version cannot contain this amount of data.
` + "Minimum version required to store current data is: " + bestVersion + `.
`);
    }
    const dataBits = createData(version, errorCorrectionLevel, segments);
    const moduleCount = Utils.getSymbolSize(version);
    const modules = new BitMatrix(moduleCount);
    setupFinderPattern(modules, version);
    setupTimingPattern(modules);
    setupAlignmentPattern(modules, version);
    setupFormatInfo(modules, errorCorrectionLevel, 0);
    if (version >= 7) {
      setupVersionInfo(modules, version);
    }
    setupData(modules, dataBits);
    if (isNaN(maskPattern)) {
      maskPattern = MaskPattern.getBestMask(modules, setupFormatInfo.bind(null, modules, errorCorrectionLevel));
    }
    MaskPattern.applyMask(maskPattern, modules);
    setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
    return {
      modules,
      version,
      errorCorrectionLevel,
      maskPattern,
      segments
    };
  }
  exports.create = function create(data, options) {
    if (typeof data === "undefined" || data === "") {
      throw new Error("No input text");
    }
    let errorCorrectionLevel = ECLevel.M;
    let version;
    let mask;
    if (typeof options !== "undefined") {
      errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
      version = Version.from(options.version);
      mask = MaskPattern.from(options.maskPattern);
      if (options.toSJISFunc) {
        Utils.setToSJISFunction(options.toSJISFunc);
      }
    }
    return createSymbol(data, version, errorCorrectionLevel, mask);
  };
});

// ../node_modules/qrcode/lib/renderer/utils.js
var require_utils2 = __commonJS((exports) => {
  function hex2rgba(hex) {
    if (typeof hex === "number") {
      hex = hex.toString();
    }
    if (typeof hex !== "string") {
      throw new Error("Color should be defined as hex string");
    }
    let hexCode = hex.slice().replace("#", "").split("");
    if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
      throw new Error("Invalid hex color: " + hex);
    }
    if (hexCode.length === 3 || hexCode.length === 4) {
      hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
        return [c, c];
      }));
    }
    if (hexCode.length === 6)
      hexCode.push("F", "F");
    const hexValue = parseInt(hexCode.join(""), 16);
    return {
      r: hexValue >> 24 & 255,
      g: hexValue >> 16 & 255,
      b: hexValue >> 8 & 255,
      a: hexValue & 255,
      hex: "#" + hexCode.slice(0, 6).join("")
    };
  }
  exports.getOptions = function getOptions(options) {
    if (!options)
      options = {};
    if (!options.color)
      options.color = {};
    const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
    const width = options.width && options.width >= 21 ? options.width : undefined;
    const scale = options.scale || 4;
    return {
      width,
      scale: width ? 4 : scale,
      margin,
      color: {
        dark: hex2rgba(options.color.dark || "#000000ff"),
        light: hex2rgba(options.color.light || "#ffffffff")
      },
      type: options.type,
      rendererOpts: options.rendererOpts || {}
    };
  };
  exports.getScale = function getScale(qrSize, opts) {
    return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
  };
  exports.getImageWidth = function getImageWidth(qrSize, opts) {
    const scale = exports.getScale(qrSize, opts);
    return Math.floor((qrSize + opts.margin * 2) * scale);
  };
  exports.qrToImageData = function qrToImageData(imgData, qr, opts) {
    const size = qr.modules.size;
    const data = qr.modules.data;
    const scale = exports.getScale(size, opts);
    const symbolSize = Math.floor((size + opts.margin * 2) * scale);
    const scaledMargin = opts.margin * scale;
    const palette = [opts.color.light, opts.color.dark];
    for (let i = 0;i < symbolSize; i++) {
      for (let j = 0;j < symbolSize; j++) {
        let posDst = (i * symbolSize + j) * 4;
        let pxColor = opts.color.light;
        if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
          const iSrc = Math.floor((i - scaledMargin) / scale);
          const jSrc = Math.floor((j - scaledMargin) / scale);
          pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
        }
        imgData[posDst++] = pxColor.r;
        imgData[posDst++] = pxColor.g;
        imgData[posDst++] = pxColor.b;
        imgData[posDst] = pxColor.a;
      }
    }
  };
});

// ../node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = __commonJS((exports) => {
  var Utils = require_utils2();
  function clearCanvas(ctx, canvas, size) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!canvas.style)
      canvas.style = {};
    canvas.height = size;
    canvas.width = size;
    canvas.style.height = size + "px";
    canvas.style.width = size + "px";
  }
  function getCanvasElement() {
    try {
      return document.createElement("canvas");
    } catch (e) {
      throw new Error("You need to specify a canvas element");
    }
  }
  exports.render = function render(qrData, canvas, options) {
    let opts = options;
    let canvasEl = canvas;
    if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
      opts = canvas;
      canvas = undefined;
    }
    if (!canvas) {
      canvasEl = getCanvasElement();
    }
    opts = Utils.getOptions(opts);
    const size = Utils.getImageWidth(qrData.modules.size, opts);
    const ctx = canvasEl.getContext("2d");
    const image = ctx.createImageData(size, size);
    Utils.qrToImageData(image.data, qrData, opts);
    clearCanvas(ctx, canvasEl, size);
    ctx.putImageData(image, 0, 0);
    return canvasEl;
  };
  exports.renderToDataURL = function renderToDataURL(qrData, canvas, options) {
    let opts = options;
    if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
      opts = canvas;
      canvas = undefined;
    }
    if (!opts)
      opts = {};
    const canvasEl = exports.render(qrData, canvas, opts);
    const type = opts.type || "image/png";
    const rendererOpts = opts.rendererOpts || {};
    return canvasEl.toDataURL(type, rendererOpts.quality);
  };
});

// ../node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = __commonJS((exports) => {
  var Utils = require_utils2();
  function getColorAttrib(color, attrib) {
    const alpha = color.a / 255;
    const str = attrib + '="' + color.hex + '"';
    return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
  }
  function svgCmd(cmd, x, y) {
    let str = cmd + x;
    if (typeof y !== "undefined")
      str += " " + y;
    return str;
  }
  function qrToPath(data, size, margin) {
    let path = "";
    let moveBy = 0;
    let newRow = false;
    let lineLength = 0;
    for (let i = 0;i < data.length; i++) {
      const col = Math.floor(i % size);
      const row = Math.floor(i / size);
      if (!col && !newRow)
        newRow = true;
      if (data[i]) {
        lineLength++;
        if (!(i > 0 && col > 0 && data[i - 1])) {
          path += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
          moveBy = 0;
          newRow = false;
        }
        if (!(col + 1 < size && data[i + 1])) {
          path += svgCmd("h", lineLength);
          lineLength = 0;
        }
      } else {
        moveBy++;
      }
    }
    return path;
  }
  exports.render = function render(qrData, options, cb) {
    const opts = Utils.getOptions(options);
    const size = qrData.modules.size;
    const data = qrData.modules.data;
    const qrcodesize = size + opts.margin * 2;
    const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
    const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
    const viewBox = 'viewBox="' + "0 0 " + qrcodesize + " " + qrcodesize + '"';
    const width = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
    const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width + viewBox + ' shape-rendering="crispEdges">' + bg + path + `</svg>
`;
    if (typeof cb === "function") {
      cb(null, svgTag);
    }
    return svgTag;
  };
});

// ../node_modules/qrcode/lib/browser.js
var require_browser = __commonJS((exports) => {
  var canPromise = require_can_promise();
  var QRCode = require_qrcode();
  var CanvasRenderer = require_canvas();
  var SvgRenderer = require_svg_tag();
  function renderCanvas(renderFunc, canvas, text, opts, cb) {
    const args = [].slice.call(arguments, 1);
    const argsNum = args.length;
    const isLastArgCb = typeof args[argsNum - 1] === "function";
    if (!isLastArgCb && !canPromise()) {
      throw new Error("Callback required as last argument");
    }
    if (isLastArgCb) {
      if (argsNum < 2) {
        throw new Error("Too few arguments provided");
      }
      if (argsNum === 2) {
        cb = text;
        text = canvas;
        canvas = opts = undefined;
      } else if (argsNum === 3) {
        if (canvas.getContext && typeof cb === "undefined") {
          cb = opts;
          opts = undefined;
        } else {
          cb = opts;
          opts = text;
          text = canvas;
          canvas = undefined;
        }
      }
    } else {
      if (argsNum < 1) {
        throw new Error("Too few arguments provided");
      }
      if (argsNum === 1) {
        text = canvas;
        canvas = opts = undefined;
      } else if (argsNum === 2 && !canvas.getContext) {
        opts = text;
        text = canvas;
        canvas = undefined;
      }
      return new Promise(function(resolve, reject) {
        try {
          const data = QRCode.create(text, opts);
          resolve(renderFunc(data, canvas, opts));
        } catch (e) {
          reject(e);
        }
      });
    }
    try {
      const data = QRCode.create(text, opts);
      cb(null, renderFunc(data, canvas, opts));
    } catch (e) {
      cb(e);
    }
  }
  exports.create = QRCode.create;
  exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
  exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
  exports.toString = renderCanvas.bind(null, function(data, _, opts) {
    return SvgRenderer.render(data, opts);
  });
});

// ../node_modules/@dobuki/firebase-store/dist/index.js
var __create2 = Object.create;
var __getProtoOf2 = Object.getPrototypeOf;
var __defProp2 = Object.defineProperty;
var __getOwnPropNames2 = Object.getOwnPropertyNames;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __toESM2 = (mod, isNodeMode, target) => {
  target = mod != null ? __create2(__getProtoOf2(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp2(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames2(mod))
    if (!__hasOwnProp2.call(to, key))
      __defProp2(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS2 = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var require_uint32 = __commonJS2((exports, module) => {
  (function(root) {
    var radixPowerCache = {
      36: UINT32(Math.pow(36, 5)),
      16: UINT32(Math.pow(16, 7)),
      10: UINT32(Math.pow(10, 9)),
      2: UINT32(Math.pow(2, 30))
    };
    var radixCache = {
      36: UINT32(36),
      16: UINT32(16),
      10: UINT32(10),
      2: UINT32(2)
    };
    function UINT32(l, h) {
      if (!(this instanceof UINT32))
        return new UINT32(l, h);
      this._low = 0;
      this._high = 0;
      this.remainder = null;
      if (typeof h == "undefined")
        return fromNumber.call(this, l);
      if (typeof l == "string")
        return fromString.call(this, l, h);
      fromBits.call(this, l, h);
    }
    function fromBits(l, h) {
      this._low = l | 0;
      this._high = h | 0;
      return this;
    }
    UINT32.prototype.fromBits = fromBits;
    function fromNumber(value) {
      this._low = value & 65535;
      this._high = value >>> 16;
      return this;
    }
    UINT32.prototype.fromNumber = fromNumber;
    function fromString(s, radix) {
      var value = parseInt(s, radix || 10);
      this._low = value & 65535;
      this._high = value >>> 16;
      return this;
    }
    UINT32.prototype.fromString = fromString;
    UINT32.prototype.toNumber = function() {
      return this._high * 65536 + this._low;
    };
    UINT32.prototype.toString = function(radix) {
      return this.toNumber().toString(radix || 10);
    };
    UINT32.prototype.add = function(other) {
      var a00 = this._low + other._low;
      var a16 = a00 >>> 16;
      a16 += this._high + other._high;
      this._low = a00 & 65535;
      this._high = a16 & 65535;
      return this;
    };
    UINT32.prototype.subtract = function(other) {
      return this.add(other.clone().negate());
    };
    UINT32.prototype.multiply = function(other) {
      var a16 = this._high;
      var a00 = this._low;
      var b16 = other._high;
      var b00 = other._low;
      var c16, c00;
      c00 = a00 * b00;
      c16 = c00 >>> 16;
      c16 += a16 * b00;
      c16 &= 65535;
      c16 += a00 * b16;
      this._low = c00 & 65535;
      this._high = c16 & 65535;
      return this;
    };
    UINT32.prototype.div = function(other) {
      if (other._low == 0 && other._high == 0)
        throw Error("division by zero");
      if (other._high == 0 && other._low == 1) {
        this.remainder = new UINT32(0);
        return this;
      }
      if (other.gt(this)) {
        this.remainder = this.clone();
        this._low = 0;
        this._high = 0;
        return this;
      }
      if (this.eq(other)) {
        this.remainder = new UINT32(0);
        this._low = 1;
        this._high = 0;
        return this;
      }
      var _other = other.clone();
      var i = -1;
      while (!this.lt(_other)) {
        _other.shiftLeft(1, true);
        i++;
      }
      this.remainder = this.clone();
      this._low = 0;
      this._high = 0;
      for (;i >= 0; i--) {
        _other.shiftRight(1);
        if (!this.remainder.lt(_other)) {
          this.remainder.subtract(_other);
          if (i >= 16) {
            this._high |= 1 << i - 16;
          } else {
            this._low |= 1 << i;
          }
        }
      }
      return this;
    };
    UINT32.prototype.negate = function() {
      var v = (~this._low & 65535) + 1;
      this._low = v & 65535;
      this._high = ~this._high + (v >>> 16) & 65535;
      return this;
    };
    UINT32.prototype.equals = UINT32.prototype.eq = function(other) {
      return this._low == other._low && this._high == other._high;
    };
    UINT32.prototype.greaterThan = UINT32.prototype.gt = function(other) {
      if (this._high > other._high)
        return true;
      if (this._high < other._high)
        return false;
      return this._low > other._low;
    };
    UINT32.prototype.lessThan = UINT32.prototype.lt = function(other) {
      if (this._high < other._high)
        return true;
      if (this._high > other._high)
        return false;
      return this._low < other._low;
    };
    UINT32.prototype.or = function(other) {
      this._low |= other._low;
      this._high |= other._high;
      return this;
    };
    UINT32.prototype.and = function(other) {
      this._low &= other._low;
      this._high &= other._high;
      return this;
    };
    UINT32.prototype.not = function() {
      this._low = ~this._low & 65535;
      this._high = ~this._high & 65535;
      return this;
    };
    UINT32.prototype.xor = function(other) {
      this._low ^= other._low;
      this._high ^= other._high;
      return this;
    };
    UINT32.prototype.shiftRight = UINT32.prototype.shiftr = function(n) {
      if (n > 16) {
        this._low = this._high >> n - 16;
        this._high = 0;
      } else if (n == 16) {
        this._low = this._high;
        this._high = 0;
      } else {
        this._low = this._low >> n | this._high << 16 - n & 65535;
        this._high >>= n;
      }
      return this;
    };
    UINT32.prototype.shiftLeft = UINT32.prototype.shiftl = function(n, allowOverflow) {
      if (n > 16) {
        this._high = this._low << n - 16;
        this._low = 0;
        if (!allowOverflow) {
          this._high &= 65535;
        }
      } else if (n == 16) {
        this._high = this._low;
        this._low = 0;
      } else {
        this._high = this._high << n | this._low >> 16 - n;
        this._low = this._low << n & 65535;
        if (!allowOverflow) {
          this._high &= 65535;
        }
      }
      return this;
    };
    UINT32.prototype.rotateLeft = UINT32.prototype.rotl = function(n) {
      var v = this._high << 16 | this._low;
      v = v << n | v >>> 32 - n;
      this._low = v & 65535;
      this._high = v >>> 16;
      return this;
    };
    UINT32.prototype.rotateRight = UINT32.prototype.rotr = function(n) {
      var v = this._high << 16 | this._low;
      v = v >>> n | v << 32 - n;
      this._low = v & 65535;
      this._high = v >>> 16;
      return this;
    };
    UINT32.prototype.clone = function() {
      return new UINT32(this._low, this._high);
    };
    if (typeof define != "undefined" && define.amd) {
      define([], function() {
        return UINT32;
      });
    } else if (typeof module != "undefined" && module.exports) {
      module.exports = UINT32;
    } else {
      root["UINT32"] = UINT32;
    }
  })(exports);
});
var require_uint64 = __commonJS2((exports, module) => {
  (function(root) {
    var radixPowerCache = {
      16: UINT64(Math.pow(16, 5)),
      10: UINT64(Math.pow(10, 5)),
      2: UINT64(Math.pow(2, 5))
    };
    var radixCache = {
      16: UINT64(16),
      10: UINT64(10),
      2: UINT64(2)
    };
    function UINT64(a00, a16, a32, a48) {
      if (!(this instanceof UINT64))
        return new UINT64(a00, a16, a32, a48);
      this.remainder = null;
      if (typeof a00 == "string")
        return fromString.call(this, a00, a16);
      if (typeof a16 == "undefined")
        return fromNumber.call(this, a00);
      fromBits.apply(this, arguments);
    }
    function fromBits(a00, a16, a32, a48) {
      if (typeof a32 == "undefined") {
        this._a00 = a00 & 65535;
        this._a16 = a00 >>> 16;
        this._a32 = a16 & 65535;
        this._a48 = a16 >>> 16;
        return this;
      }
      this._a00 = a00 | 0;
      this._a16 = a16 | 0;
      this._a32 = a32 | 0;
      this._a48 = a48 | 0;
      return this;
    }
    UINT64.prototype.fromBits = fromBits;
    function fromNumber(value) {
      this._a00 = value & 65535;
      this._a16 = value >>> 16;
      this._a32 = 0;
      this._a48 = 0;
      return this;
    }
    UINT64.prototype.fromNumber = fromNumber;
    function fromString(s, radix) {
      radix = radix || 10;
      this._a00 = 0;
      this._a16 = 0;
      this._a32 = 0;
      this._a48 = 0;
      var radixUint = radixPowerCache[radix] || new UINT64(Math.pow(radix, 5));
      for (var i = 0, len = s.length;i < len; i += 5) {
        var size = Math.min(5, len - i);
        var value = parseInt(s.slice(i, i + size), radix);
        this.multiply(size < 5 ? new UINT64(Math.pow(radix, size)) : radixUint).add(new UINT64(value));
      }
      return this;
    }
    UINT64.prototype.fromString = fromString;
    UINT64.prototype.toNumber = function() {
      return this._a16 * 65536 + this._a00;
    };
    UINT64.prototype.toString = function(radix) {
      radix = radix || 10;
      var radixUint = radixCache[radix] || new UINT64(radix);
      if (!this.gt(radixUint))
        return this.toNumber().toString(radix);
      var self = this.clone();
      var res = new Array(64);
      for (var i = 63;i >= 0; i--) {
        self.div(radixUint);
        res[i] = self.remainder.toNumber().toString(radix);
        if (!self.gt(radixUint))
          break;
      }
      res[i - 1] = self.toNumber().toString(radix);
      return res.join("");
    };
    UINT64.prototype.add = function(other) {
      var a00 = this._a00 + other._a00;
      var a16 = a00 >>> 16;
      a16 += this._a16 + other._a16;
      var a32 = a16 >>> 16;
      a32 += this._a32 + other._a32;
      var a48 = a32 >>> 16;
      a48 += this._a48 + other._a48;
      this._a00 = a00 & 65535;
      this._a16 = a16 & 65535;
      this._a32 = a32 & 65535;
      this._a48 = a48 & 65535;
      return this;
    };
    UINT64.prototype.subtract = function(other) {
      return this.add(other.clone().negate());
    };
    UINT64.prototype.multiply = function(other) {
      var a00 = this._a00;
      var a16 = this._a16;
      var a32 = this._a32;
      var a48 = this._a48;
      var b00 = other._a00;
      var b16 = other._a16;
      var b32 = other._a32;
      var b48 = other._a48;
      var c00 = a00 * b00;
      var c16 = c00 >>> 16;
      c16 += a00 * b16;
      var c32 = c16 >>> 16;
      c16 &= 65535;
      c16 += a16 * b00;
      c32 += c16 >>> 16;
      c32 += a00 * b32;
      var c48 = c32 >>> 16;
      c32 &= 65535;
      c32 += a16 * b16;
      c48 += c32 >>> 16;
      c32 &= 65535;
      c32 += a32 * b00;
      c48 += c32 >>> 16;
      c48 += a00 * b48;
      c48 &= 65535;
      c48 += a16 * b32;
      c48 &= 65535;
      c48 += a32 * b16;
      c48 &= 65535;
      c48 += a48 * b00;
      this._a00 = c00 & 65535;
      this._a16 = c16 & 65535;
      this._a32 = c32 & 65535;
      this._a48 = c48 & 65535;
      return this;
    };
    UINT64.prototype.div = function(other) {
      if (other._a16 == 0 && other._a32 == 0 && other._a48 == 0) {
        if (other._a00 == 0)
          throw Error("division by zero");
        if (other._a00 == 1) {
          this.remainder = new UINT64(0);
          return this;
        }
      }
      if (other.gt(this)) {
        this.remainder = this.clone();
        this._a00 = 0;
        this._a16 = 0;
        this._a32 = 0;
        this._a48 = 0;
        return this;
      }
      if (this.eq(other)) {
        this.remainder = new UINT64(0);
        this._a00 = 1;
        this._a16 = 0;
        this._a32 = 0;
        this._a48 = 0;
        return this;
      }
      var _other = other.clone();
      var i = -1;
      while (!this.lt(_other)) {
        _other.shiftLeft(1, true);
        i++;
      }
      this.remainder = this.clone();
      this._a00 = 0;
      this._a16 = 0;
      this._a32 = 0;
      this._a48 = 0;
      for (;i >= 0; i--) {
        _other.shiftRight(1);
        if (!this.remainder.lt(_other)) {
          this.remainder.subtract(_other);
          if (i >= 48) {
            this._a48 |= 1 << i - 48;
          } else if (i >= 32) {
            this._a32 |= 1 << i - 32;
          } else if (i >= 16) {
            this._a16 |= 1 << i - 16;
          } else {
            this._a00 |= 1 << i;
          }
        }
      }
      return this;
    };
    UINT64.prototype.negate = function() {
      var v = (~this._a00 & 65535) + 1;
      this._a00 = v & 65535;
      v = (~this._a16 & 65535) + (v >>> 16);
      this._a16 = v & 65535;
      v = (~this._a32 & 65535) + (v >>> 16);
      this._a32 = v & 65535;
      this._a48 = ~this._a48 + (v >>> 16) & 65535;
      return this;
    };
    UINT64.prototype.equals = UINT64.prototype.eq = function(other) {
      return this._a48 == other._a48 && this._a00 == other._a00 && this._a32 == other._a32 && this._a16 == other._a16;
    };
    UINT64.prototype.greaterThan = UINT64.prototype.gt = function(other) {
      if (this._a48 > other._a48)
        return true;
      if (this._a48 < other._a48)
        return false;
      if (this._a32 > other._a32)
        return true;
      if (this._a32 < other._a32)
        return false;
      if (this._a16 > other._a16)
        return true;
      if (this._a16 < other._a16)
        return false;
      return this._a00 > other._a00;
    };
    UINT64.prototype.lessThan = UINT64.prototype.lt = function(other) {
      if (this._a48 < other._a48)
        return true;
      if (this._a48 > other._a48)
        return false;
      if (this._a32 < other._a32)
        return true;
      if (this._a32 > other._a32)
        return false;
      if (this._a16 < other._a16)
        return true;
      if (this._a16 > other._a16)
        return false;
      return this._a00 < other._a00;
    };
    UINT64.prototype.or = function(other) {
      this._a00 |= other._a00;
      this._a16 |= other._a16;
      this._a32 |= other._a32;
      this._a48 |= other._a48;
      return this;
    };
    UINT64.prototype.and = function(other) {
      this._a00 &= other._a00;
      this._a16 &= other._a16;
      this._a32 &= other._a32;
      this._a48 &= other._a48;
      return this;
    };
    UINT64.prototype.xor = function(other) {
      this._a00 ^= other._a00;
      this._a16 ^= other._a16;
      this._a32 ^= other._a32;
      this._a48 ^= other._a48;
      return this;
    };
    UINT64.prototype.not = function() {
      this._a00 = ~this._a00 & 65535;
      this._a16 = ~this._a16 & 65535;
      this._a32 = ~this._a32 & 65535;
      this._a48 = ~this._a48 & 65535;
      return this;
    };
    UINT64.prototype.shiftRight = UINT64.prototype.shiftr = function(n) {
      n %= 64;
      if (n >= 48) {
        this._a00 = this._a48 >> n - 48;
        this._a16 = 0;
        this._a32 = 0;
        this._a48 = 0;
      } else if (n >= 32) {
        n -= 32;
        this._a00 = (this._a32 >> n | this._a48 << 16 - n) & 65535;
        this._a16 = this._a48 >> n & 65535;
        this._a32 = 0;
        this._a48 = 0;
      } else if (n >= 16) {
        n -= 16;
        this._a00 = (this._a16 >> n | this._a32 << 16 - n) & 65535;
        this._a16 = (this._a32 >> n | this._a48 << 16 - n) & 65535;
        this._a32 = this._a48 >> n & 65535;
        this._a48 = 0;
      } else {
        this._a00 = (this._a00 >> n | this._a16 << 16 - n) & 65535;
        this._a16 = (this._a16 >> n | this._a32 << 16 - n) & 65535;
        this._a32 = (this._a32 >> n | this._a48 << 16 - n) & 65535;
        this._a48 = this._a48 >> n & 65535;
      }
      return this;
    };
    UINT64.prototype.shiftLeft = UINT64.prototype.shiftl = function(n, allowOverflow) {
      n %= 64;
      if (n >= 48) {
        this._a48 = this._a00 << n - 48;
        this._a32 = 0;
        this._a16 = 0;
        this._a00 = 0;
      } else if (n >= 32) {
        n -= 32;
        this._a48 = this._a16 << n | this._a00 >> 16 - n;
        this._a32 = this._a00 << n & 65535;
        this._a16 = 0;
        this._a00 = 0;
      } else if (n >= 16) {
        n -= 16;
        this._a48 = this._a32 << n | this._a16 >> 16 - n;
        this._a32 = (this._a16 << n | this._a00 >> 16 - n) & 65535;
        this._a16 = this._a00 << n & 65535;
        this._a00 = 0;
      } else {
        this._a48 = this._a48 << n | this._a32 >> 16 - n;
        this._a32 = (this._a32 << n | this._a16 >> 16 - n) & 65535;
        this._a16 = (this._a16 << n | this._a00 >> 16 - n) & 65535;
        this._a00 = this._a00 << n & 65535;
      }
      if (!allowOverflow) {
        this._a48 &= 65535;
      }
      return this;
    };
    UINT64.prototype.rotateLeft = UINT64.prototype.rotl = function(n) {
      n %= 64;
      if (n == 0)
        return this;
      if (n >= 32) {
        var v = this._a00;
        this._a00 = this._a32;
        this._a32 = v;
        v = this._a48;
        this._a48 = this._a16;
        this._a16 = v;
        if (n == 32)
          return this;
        n -= 32;
      }
      var high = this._a48 << 16 | this._a32;
      var low = this._a16 << 16 | this._a00;
      var _high = high << n | low >>> 32 - n;
      var _low = low << n | high >>> 32 - n;
      this._a00 = _low & 65535;
      this._a16 = _low >>> 16;
      this._a32 = _high & 65535;
      this._a48 = _high >>> 16;
      return this;
    };
    UINT64.prototype.rotateRight = UINT64.prototype.rotr = function(n) {
      n %= 64;
      if (n == 0)
        return this;
      if (n >= 32) {
        var v = this._a00;
        this._a00 = this._a32;
        this._a32 = v;
        v = this._a48;
        this._a48 = this._a16;
        this._a16 = v;
        if (n == 32)
          return this;
        n -= 32;
      }
      var high = this._a48 << 16 | this._a32;
      var low = this._a16 << 16 | this._a00;
      var _high = high >>> n | low << 32 - n;
      var _low = low >>> n | high << 32 - n;
      this._a00 = _low & 65535;
      this._a16 = _low >>> 16;
      this._a32 = _high & 65535;
      this._a48 = _high >>> 16;
      return this;
    };
    UINT64.prototype.clone = function() {
      return new UINT64(this._a00, this._a16, this._a32, this._a48);
    };
    if (typeof define != "undefined" && define.amd) {
      define([], function() {
        return UINT64;
      });
    } else if (typeof module != "undefined" && module.exports) {
      module.exports = UINT64;
    } else {
      root["UINT64"] = UINT64;
    }
  })(exports);
});
var require_cuint = __commonJS2((exports) => {
  exports.UINT32 = require_uint32();
  exports.UINT64 = require_uint64();
});
var require_xxhash = __commonJS2((exports, module) => {
  var UINT32 = require_cuint().UINT32;
  UINT32.prototype.xxh_update = function(low, high) {
    var b00 = PRIME32_2._low;
    var b16 = PRIME32_2._high;
    var c16, c00;
    c00 = low * b00;
    c16 = c00 >>> 16;
    c16 += high * b00;
    c16 &= 65535;
    c16 += low * b16;
    var a00 = this._low + (c00 & 65535);
    var a16 = a00 >>> 16;
    a16 += this._high + (c16 & 65535);
    var v = a16 << 16 | a00 & 65535;
    v = v << 13 | v >>> 19;
    a00 = v & 65535;
    a16 = v >>> 16;
    b00 = PRIME32_1._low;
    b16 = PRIME32_1._high;
    c00 = a00 * b00;
    c16 = c00 >>> 16;
    c16 += a16 * b00;
    c16 &= 65535;
    c16 += a00 * b16;
    this._low = c00 & 65535;
    this._high = c16 & 65535;
  };
  var PRIME32_1 = UINT32("2654435761");
  var PRIME32_2 = UINT32("2246822519");
  var PRIME32_3 = UINT32("3266489917");
  var PRIME32_4 = UINT32("668265263");
  var PRIME32_5 = UINT32("374761393");
  function toUTF8Array(str) {
    var utf8 = [];
    for (var i = 0, n = str.length;i < n; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 128)
        utf8.push(charcode);
      else if (charcode < 2048) {
        utf8.push(192 | charcode >> 6, 128 | charcode & 63);
      } else if (charcode < 55296 || charcode >= 57344) {
        utf8.push(224 | charcode >> 12, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      } else {
        i++;
        charcode = 65536 + ((charcode & 1023) << 10 | str.charCodeAt(i) & 1023);
        utf8.push(240 | charcode >> 18, 128 | charcode >> 12 & 63, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      }
    }
    return new Uint8Array(utf8);
  }
  function XXH() {
    if (arguments.length == 2)
      return new XXH(arguments[1]).update(arguments[0]).digest();
    if (!(this instanceof XXH))
      return new XXH(arguments[0]);
    init.call(this, arguments[0]);
  }
  function init(seed) {
    this.seed = seed instanceof UINT32 ? seed.clone() : UINT32(seed);
    this.v1 = this.seed.clone().add(PRIME32_1).add(PRIME32_2);
    this.v2 = this.seed.clone().add(PRIME32_2);
    this.v3 = this.seed.clone();
    this.v4 = this.seed.clone().subtract(PRIME32_1);
    this.total_len = 0;
    this.memsize = 0;
    this.memory = null;
    return this;
  }
  XXH.prototype.init = init;
  XXH.prototype.update = function(input) {
    var isString = typeof input == "string";
    var isArrayBuffer;
    if (isString) {
      input = toUTF8Array(input);
      isString = false;
      isArrayBuffer = true;
    }
    if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer) {
      isArrayBuffer = true;
      input = new Uint8Array(input);
    }
    var p = 0;
    var len = input.length;
    var bEnd = p + len;
    if (len == 0)
      return this;
    this.total_len += len;
    if (this.memsize == 0) {
      if (isString) {
        this.memory = "";
      } else if (isArrayBuffer) {
        this.memory = new Uint8Array(16);
      } else {
        this.memory = new Buffer(16);
      }
    }
    if (this.memsize + len < 16) {
      if (isString) {
        this.memory += input;
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(0, len), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, 0, len);
      }
      this.memsize += len;
      return this;
    }
    if (this.memsize > 0) {
      if (isString) {
        this.memory += input.slice(0, 16 - this.memsize);
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(0, 16 - this.memsize), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, 0, 16 - this.memsize);
      }
      var p32 = 0;
      if (isString) {
        this.v1.xxh_update(this.memory.charCodeAt(p32 + 1) << 8 | this.memory.charCodeAt(p32), this.memory.charCodeAt(p32 + 3) << 8 | this.memory.charCodeAt(p32 + 2));
        p32 += 4;
        this.v2.xxh_update(this.memory.charCodeAt(p32 + 1) << 8 | this.memory.charCodeAt(p32), this.memory.charCodeAt(p32 + 3) << 8 | this.memory.charCodeAt(p32 + 2));
        p32 += 4;
        this.v3.xxh_update(this.memory.charCodeAt(p32 + 1) << 8 | this.memory.charCodeAt(p32), this.memory.charCodeAt(p32 + 3) << 8 | this.memory.charCodeAt(p32 + 2));
        p32 += 4;
        this.v4.xxh_update(this.memory.charCodeAt(p32 + 1) << 8 | this.memory.charCodeAt(p32), this.memory.charCodeAt(p32 + 3) << 8 | this.memory.charCodeAt(p32 + 2));
      } else {
        this.v1.xxh_update(this.memory[p32 + 1] << 8 | this.memory[p32], this.memory[p32 + 3] << 8 | this.memory[p32 + 2]);
        p32 += 4;
        this.v2.xxh_update(this.memory[p32 + 1] << 8 | this.memory[p32], this.memory[p32 + 3] << 8 | this.memory[p32 + 2]);
        p32 += 4;
        this.v3.xxh_update(this.memory[p32 + 1] << 8 | this.memory[p32], this.memory[p32 + 3] << 8 | this.memory[p32 + 2]);
        p32 += 4;
        this.v4.xxh_update(this.memory[p32 + 1] << 8 | this.memory[p32], this.memory[p32 + 3] << 8 | this.memory[p32 + 2]);
      }
      p += 16 - this.memsize;
      this.memsize = 0;
      if (isString)
        this.memory = "";
    }
    if (p <= bEnd - 16) {
      var limit = bEnd - 16;
      do {
        if (isString) {
          this.v1.xxh_update(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
          p += 4;
          this.v2.xxh_update(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
          p += 4;
          this.v3.xxh_update(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
          p += 4;
          this.v4.xxh_update(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
        } else {
          this.v1.xxh_update(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
          p += 4;
          this.v2.xxh_update(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
          p += 4;
          this.v3.xxh_update(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
          p += 4;
          this.v4.xxh_update(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
        }
        p += 4;
      } while (p <= limit);
    }
    if (p < bEnd) {
      if (isString) {
        this.memory += input.slice(p);
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(p, bEnd), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, p, bEnd);
      }
      this.memsize = bEnd - p;
    }
    return this;
  };
  XXH.prototype.digest = function() {
    var input = this.memory;
    var isString = typeof input == "string";
    var p = 0;
    var bEnd = this.memsize;
    var h32, h;
    var u = new UINT32;
    if (this.total_len >= 16) {
      h32 = this.v1.rotl(1).add(this.v2.rotl(7).add(this.v3.rotl(12).add(this.v4.rotl(18))));
    } else {
      h32 = this.seed.clone().add(PRIME32_5);
    }
    h32.add(u.fromNumber(this.total_len));
    while (p <= bEnd - 4) {
      if (isString) {
        u.fromBits(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2));
      } else {
        u.fromBits(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2]);
      }
      h32.add(u.multiply(PRIME32_3)).rotl(17).multiply(PRIME32_4);
      p += 4;
    }
    while (p < bEnd) {
      u.fromBits(isString ? input.charCodeAt(p++) : input[p++], 0);
      h32.add(u.multiply(PRIME32_5)).rotl(11).multiply(PRIME32_1);
    }
    h = h32.clone().shiftRight(15);
    h32.xor(h).multiply(PRIME32_2);
    h = h32.clone().shiftRight(13);
    h32.xor(h).multiply(PRIME32_3);
    h = h32.clone().shiftRight(16);
    h32.xor(h);
    this.init(this.seed);
    return h32;
  };
  module.exports = XXH;
});
var require_xxhash64 = __commonJS2((exports, module) => {
  var UINT64 = require_cuint().UINT64;
  var PRIME64_1 = UINT64("11400714785074694791");
  var PRIME64_2 = UINT64("14029467366897019727");
  var PRIME64_3 = UINT64("1609587929392839161");
  var PRIME64_4 = UINT64("9650029242287828579");
  var PRIME64_5 = UINT64("2870177450012600261");
  function toUTF8Array(str) {
    var utf8 = [];
    for (var i = 0, n = str.length;i < n; i++) {
      var charcode = str.charCodeAt(i);
      if (charcode < 128)
        utf8.push(charcode);
      else if (charcode < 2048) {
        utf8.push(192 | charcode >> 6, 128 | charcode & 63);
      } else if (charcode < 55296 || charcode >= 57344) {
        utf8.push(224 | charcode >> 12, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      } else {
        i++;
        charcode = 65536 + ((charcode & 1023) << 10 | str.charCodeAt(i) & 1023);
        utf8.push(240 | charcode >> 18, 128 | charcode >> 12 & 63, 128 | charcode >> 6 & 63, 128 | charcode & 63);
      }
    }
    return new Uint8Array(utf8);
  }
  function XXH64() {
    if (arguments.length == 2)
      return new XXH64(arguments[1]).update(arguments[0]).digest();
    if (!(this instanceof XXH64))
      return new XXH64(arguments[0]);
    init.call(this, arguments[0]);
  }
  function init(seed) {
    this.seed = seed instanceof UINT64 ? seed.clone() : UINT64(seed);
    this.v1 = this.seed.clone().add(PRIME64_1).add(PRIME64_2);
    this.v2 = this.seed.clone().add(PRIME64_2);
    this.v3 = this.seed.clone();
    this.v4 = this.seed.clone().subtract(PRIME64_1);
    this.total_len = 0;
    this.memsize = 0;
    this.memory = null;
    return this;
  }
  XXH64.prototype.init = init;
  XXH64.prototype.update = function(input) {
    var isString = typeof input == "string";
    var isArrayBuffer;
    if (isString) {
      input = toUTF8Array(input);
      isString = false;
      isArrayBuffer = true;
    }
    if (typeof ArrayBuffer !== "undefined" && input instanceof ArrayBuffer) {
      isArrayBuffer = true;
      input = new Uint8Array(input);
    }
    var p = 0;
    var len = input.length;
    var bEnd = p + len;
    if (len == 0)
      return this;
    this.total_len += len;
    if (this.memsize == 0) {
      if (isString) {
        this.memory = "";
      } else if (isArrayBuffer) {
        this.memory = new Uint8Array(32);
      } else {
        this.memory = new Buffer(32);
      }
    }
    if (this.memsize + len < 32) {
      if (isString) {
        this.memory += input;
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(0, len), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, 0, len);
      }
      this.memsize += len;
      return this;
    }
    if (this.memsize > 0) {
      if (isString) {
        this.memory += input.slice(0, 32 - this.memsize);
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(0, 32 - this.memsize), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, 0, 32 - this.memsize);
      }
      var p64 = 0;
      if (isString) {
        var other;
        other = UINT64(this.memory.charCodeAt(p64 + 1) << 8 | this.memory.charCodeAt(p64), this.memory.charCodeAt(p64 + 3) << 8 | this.memory.charCodeAt(p64 + 2), this.memory.charCodeAt(p64 + 5) << 8 | this.memory.charCodeAt(p64 + 4), this.memory.charCodeAt(p64 + 7) << 8 | this.memory.charCodeAt(p64 + 6));
        this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory.charCodeAt(p64 + 1) << 8 | this.memory.charCodeAt(p64), this.memory.charCodeAt(p64 + 3) << 8 | this.memory.charCodeAt(p64 + 2), this.memory.charCodeAt(p64 + 5) << 8 | this.memory.charCodeAt(p64 + 4), this.memory.charCodeAt(p64 + 7) << 8 | this.memory.charCodeAt(p64 + 6));
        this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory.charCodeAt(p64 + 1) << 8 | this.memory.charCodeAt(p64), this.memory.charCodeAt(p64 + 3) << 8 | this.memory.charCodeAt(p64 + 2), this.memory.charCodeAt(p64 + 5) << 8 | this.memory.charCodeAt(p64 + 4), this.memory.charCodeAt(p64 + 7) << 8 | this.memory.charCodeAt(p64 + 6));
        this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory.charCodeAt(p64 + 1) << 8 | this.memory.charCodeAt(p64), this.memory.charCodeAt(p64 + 3) << 8 | this.memory.charCodeAt(p64 + 2), this.memory.charCodeAt(p64 + 5) << 8 | this.memory.charCodeAt(p64 + 4), this.memory.charCodeAt(p64 + 7) << 8 | this.memory.charCodeAt(p64 + 6));
        this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
      } else {
        var other;
        other = UINT64(this.memory[p64 + 1] << 8 | this.memory[p64], this.memory[p64 + 3] << 8 | this.memory[p64 + 2], this.memory[p64 + 5] << 8 | this.memory[p64 + 4], this.memory[p64 + 7] << 8 | this.memory[p64 + 6]);
        this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory[p64 + 1] << 8 | this.memory[p64], this.memory[p64 + 3] << 8 | this.memory[p64 + 2], this.memory[p64 + 5] << 8 | this.memory[p64 + 4], this.memory[p64 + 7] << 8 | this.memory[p64 + 6]);
        this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory[p64 + 1] << 8 | this.memory[p64], this.memory[p64 + 3] << 8 | this.memory[p64 + 2], this.memory[p64 + 5] << 8 | this.memory[p64 + 4], this.memory[p64 + 7] << 8 | this.memory[p64 + 6]);
        this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        p64 += 8;
        other = UINT64(this.memory[p64 + 1] << 8 | this.memory[p64], this.memory[p64 + 3] << 8 | this.memory[p64 + 2], this.memory[p64 + 5] << 8 | this.memory[p64 + 4], this.memory[p64 + 7] << 8 | this.memory[p64 + 6]);
        this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
      }
      p += 32 - this.memsize;
      this.memsize = 0;
      if (isString)
        this.memory = "";
    }
    if (p <= bEnd - 32) {
      var limit = bEnd - 32;
      do {
        if (isString) {
          var other;
          other = UINT64(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
          this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
          this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
          this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
          this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        } else {
          var other;
          other = UINT64(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
          this.v1.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
          this.v2.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
          this.v3.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
          p += 8;
          other = UINT64(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
          this.v4.add(other.multiply(PRIME64_2)).rotl(31).multiply(PRIME64_1);
        }
        p += 8;
      } while (p <= limit);
    }
    if (p < bEnd) {
      if (isString) {
        this.memory += input.slice(p);
      } else if (isArrayBuffer) {
        this.memory.set(input.subarray(p, bEnd), this.memsize);
      } else {
        input.copy(this.memory, this.memsize, p, bEnd);
      }
      this.memsize = bEnd - p;
    }
    return this;
  };
  XXH64.prototype.digest = function() {
    var input = this.memory;
    var isString = typeof input == "string";
    var p = 0;
    var bEnd = this.memsize;
    var h64, h;
    var u = new UINT64;
    if (this.total_len >= 32) {
      h64 = this.v1.clone().rotl(1);
      h64.add(this.v2.clone().rotl(7));
      h64.add(this.v3.clone().rotl(12));
      h64.add(this.v4.clone().rotl(18));
      h64.xor(this.v1.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);
      h64.xor(this.v2.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);
      h64.xor(this.v3.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);
      h64.xor(this.v4.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1));
      h64.multiply(PRIME64_1).add(PRIME64_4);
    } else {
      h64 = this.seed.clone().add(PRIME64_5);
    }
    h64.add(u.fromNumber(this.total_len));
    while (p <= bEnd - 8) {
      if (isString) {
        u.fromBits(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), input.charCodeAt(p + 5) << 8 | input.charCodeAt(p + 4), input.charCodeAt(p + 7) << 8 | input.charCodeAt(p + 6));
      } else {
        u.fromBits(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], input[p + 5] << 8 | input[p + 4], input[p + 7] << 8 | input[p + 6]);
      }
      u.multiply(PRIME64_2).rotl(31).multiply(PRIME64_1);
      h64.xor(u).rotl(27).multiply(PRIME64_1).add(PRIME64_4);
      p += 8;
    }
    if (p + 4 <= bEnd) {
      if (isString) {
        u.fromBits(input.charCodeAt(p + 1) << 8 | input.charCodeAt(p), input.charCodeAt(p + 3) << 8 | input.charCodeAt(p + 2), 0, 0);
      } else {
        u.fromBits(input[p + 1] << 8 | input[p], input[p + 3] << 8 | input[p + 2], 0, 0);
      }
      h64.xor(u.multiply(PRIME64_1)).rotl(23).multiply(PRIME64_2).add(PRIME64_3);
      p += 4;
    }
    while (p < bEnd) {
      u.fromBits(isString ? input.charCodeAt(p++) : input[p++], 0, 0, 0);
      h64.xor(u.multiply(PRIME64_5)).rotl(11).multiply(PRIME64_1);
    }
    h = h64.clone().shiftRight(33);
    h64.xor(h).multiply(PRIME64_2);
    h = h64.clone().shiftRight(29);
    h64.xor(h).multiply(PRIME64_3);
    h = h64.clone().shiftRight(32);
    h64.xor(h);
    this.init(this.seed);
    return h64;
  };
  module.exports = XXH64;
});
var require_lib = __commonJS2((exports, module) => {
  module.exports = {
    h32: require_xxhash(),
    h64: require_xxhash64()
  };
});
function firebaseWrappedServer(url) {
  return {
    async setKeyValue(key, value) {
      if (typeof value === "function") {
        const previous = await this.getValue(key);
        value = value(previous);
      }
      const setUrl = `${url}/${key}?value=${encodeURIComponent(JSON.stringify(value))}`;
      await fetch(setUrl, { method: "GET" });
      return value;
    },
    async getValue(key) {
      const response = await fetch(`${url}/${key}`);
      const data = await response.json();
      return data?.value ? JSON.parse(data.value) : undefined;
    },
    async list() {
      const response = await fetch(url);
      const json = await response.json();
      return json.list;
    },
    deleteKey(key) {
      const deleteUrl = `${url}/${key}?delete=1`;
      const success = navigator.sendBeacon(deleteUrl);
      if (!success) {
        localStorage.setItem("beaconFailure", `Beacon failed for key: ${key} at ${new Date().toISOString()}`);
        console.warn("Beacon failed, falling back to fetch");
        fetch(deleteUrl);
      }
    },
    async cleanup() {
      const response = await fetch(`${url}?cleanup=1`);
      const json = await response.json();
      return json;
    }
  };
}
var import_xxhashjs = __toESM2(require_lib(), 1);
var CUTOFF_7_DAYS = 7 * 24 * 60 * 60 * 1000;

// ../src/Connector.ts
var import_qrcode = __toESM(require_browser(), 1);

// ../src/channels/wait-for-key.ts
function waitForKey(key, kvStore, maxWait) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(async () => {
      const value = await kvStore.getValue(key);
      if (value || maxWait && Date.now() - start >= maxWait) {
        clearInterval(interval);
        if (value) {
          resolve(value);
        } else {
          reject("Timeout");
        }
      }
    }, 1000);
  });
}

// ../src/channels/PeerChannel.ts
var RTCCONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" }
  ]
};
var DATA_CHANNEL_LABEL = "data";

class PeerChannel {
  connector;
  kvStore;
  dataChannel;
  connection = new RTCPeerConnection(RTCCONFIG);
  keysSet = new Set;
  constructor(connector, kvStore) {
    this.connector = connector;
    this.kvStore = kvStore;
    this.connection.addEventListener("connectionstatechange", () => {
      if (this.connection.connectionState === "failed") {
        console.warn("Connection failed");
      }
    });
  }
  async setKey(key, value) {
    this.keysSet.add(key);
    this.kvStore.setKeyValue(key, value);
  }
  deleteKey(key) {
    this.keysSet.delete(key);
    this.kvStore.deleteKey(key);
  }
  async handleIceCandidates(peer) {
    const iceCandidates = [];
    this.connection.addEventListener("icecandidate", async (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate);
      } else {
        await this.setKey(`${this.room}_${peer}_ice_from_${this.connector.uid}`, iceCandidates);
      }
    });
    this.connection.addEventListener("iceconnectionstatechange", () => {
      if (this.connection.iceConnectionState === "failed") {
        console.warn("ICE connection failed");
      }
    });
  }
  async receiveIceCandidates(peer) {
    const key = `${this.room}_${this.connector.uid}_ice_from_${peer}`;
    const candidates = await waitForKey(key, this.kvStore);
    this.deleteKey(key);
    await this.addIceCandidates(candidates);
  }
  async makeOffer(peer) {
    this.handleIceCandidates(peer);
    this.dataChannel = this.connection.createDataChannel(DATA_CHANNEL_LABEL);
    this.setupDataChannel(this.dataChannel, peer);
    const offer = await this.createOffer();
    this.setKey(`${this.room}_${peer}_offer_from_${this.connector.uid}`, offer);
    const answerKey = `${this.room}_${this.connector.uid}_answer_from_${peer}`;
    const answer = await waitForKey(answerKey, this.kvStore);
    this.deleteKey(answerKey);
    await this.connection.setRemoteDescription(new RTCSessionDescription(answer));
    this.receiveIceCandidates(peer);
  }
  get room() {
    return this.connector.room;
  }
  async acceptOffer(peer, offerPassed) {
    this.connection.addEventListener("datachannel", (event) => {
      this.dataChannel = event.channel;
      this.setupDataChannel(this.dataChannel, peer);
    });
    this.handleIceCandidates(peer);
    const offerKey = `${this.room}_${this.connector.uid}_offer_from_${peer}`;
    const offer = offerPassed ?? await this.kvStore.getValue(offerKey);
    this.deleteKey(offerKey);
    await this.connection.setRemoteDescription(new RTCSessionDescription(offer));
    this.receiveIceCandidates(peer);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    await this.setKey(`${this.room}_${peer}_answer_from_${this.connector.uid}`, answer);
  }
  async createOffer() {
    try {
      const offer = await this.connection.createOffer();
      await this.connection.setLocalDescription(offer);
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }
  async addIceCandidates(candidates) {
    candidates.forEach((candidate) => this.connection.addIceCandidate(candidate));
  }
  sendData(blob) {
    if (this.dataChannel?.readyState === "open") {
      try {
        this.dataChannel?.send(blob);
      } catch (error) {
        this.connector.onError.forEach((callback) => callback(error));
      }
    } else {
      requestAnimationFrame(() => this.sendData(blob));
    }
  }
  setupDataChannel(dataChannel, peer) {
    dataChannel.addEventListener("open", () => {
      dataChannel.send(JSON.stringify({ hello: "Hello from " + this.connector.uid }));
      this.connector.onNewClient.forEach((callback) => callback(peer));
    });
    dataChannel.addEventListener("message", (event) => {
      const data = event.data instanceof ArrayBuffer ? new Blob([event.data]) : event.data;
      this.connector.receiveData(data);
    });
    dataChannel.addEventListener("closing", () => {
      console.log("Data channel closing");
      this.dataChannel = undefined;
    });
    dataChannel.addEventListener("close", () => {
      console.log("Data channel closed");
      this.connector.onClosePeer.forEach((callback) => callback(peer));
    });
    dataChannel.addEventListener("error", (error) => {
      console.error("Data channel error:", error);
      this.connector.onError.forEach((callback) => callback(error));
    });
  }
  destroy() {
    this.dataChannel?.close();
    this.connection.close();
    this.keysSet.forEach((key) => this.deleteKey(key));
  }
}

// ../../NAPL/src/cycles/data-update/data-update.ts
var KEYS = "~{keys}";
var VALUES = "~{values}";
var REGEX = /~\{([^}]+)\}/;
function commitUpdates(root, properties, updatedPaths = {}) {
  if (!root || !root.updates?.length) {
    return updatedPaths;
  }
  sortUpdates(root.updates);
  root.updates?.forEach((update) => {
    if (!update.confirmed) {
      return;
    }
    const parts = update.path.split("/");
    const leaf = getLeafObject(root, parts, 1, true);
    const prop = parts[parts.length - 1];
    const value = translateValue(update.value, properties);
    if (update.append) {
      if (!Array.isArray(leaf[prop])) {
        leaf[prop] = [];
      }
      leaf[prop] = [...leaf[prop], value];
    } else if ((update.insert ?? -1) >= 0) {
      if (!Array.isArray(leaf[prop])) {
        leaf[prop] = [];
      }
      leaf[prop] = [...leaf[prop].slice(0, update.insert ?? -1), value, ...leaf[prop].slice(update.insert)];
    } else if ((update.delete ?? -1) >= 0) {
      if (Array.isArray(leaf[prop])) {
        leaf[prop] = [...leaf[prop].slice(0, update.delete), ...leaf[prop].slice((update.delete ?? -1) + 1)];
      }
    } else if (value === undefined) {
      delete leaf[prop];
      cleanupRoot(root, parts, 0);
    } else {
      leaf[prop] = value;
    }
    updatedPaths[update.path] = leaf[prop];
  });
  clearUpdates(root, updatedPaths);
  return updatedPaths;
}
function cleanupRoot(root, parts, index) {
  if (!root || typeof root !== "object" || Array.isArray(root)) {
    return false;
  }
  if (cleanupRoot(root[parts[index]], parts, index + 1)) {
    delete root[parts[index]];
  }
  return Object.keys(root).length === 0;
}
function clearUpdates(root, updatedPaths) {
  root.updates = root.updates?.filter((update) => !(update.path in updatedPaths));
  if (!root.updates?.length) {
    delete root.updates;
  }
}
function sortUpdates(updates) {
  updates?.sort((a, b) => {
    const confirmedA = a.confirmed ?? 0;
    const confirmedB = b.confirmed ?? 0;
    if (confirmedA !== confirmedB) {
      return confirmedA - confirmedB;
    }
    return a.path.localeCompare(b.path);
  });
}
function getLeafObject(obj, parts, offset, autoCreate, properties = {}) {
  let current = obj;
  for (let i = 0;i < parts.length - offset; i++) {
    const prop = parts[i];
    const value = translateProp(current, prop, properties, autoCreate);
    if (value === undefined) {
      return value;
    }
    current = value;
  }
  return current;
}
function translateValue(value, properties) {
  if (typeof value !== "string") {
    return value;
  }
  if (value.startsWith("~{") && value.endsWith("}")) {
    switch (value) {
      default:
        const group = value.match(REGEX);
        if (group) {
          return properties[group[1]];
        }
    }
  }
  return value;
}
function translateProp(obj, prop, properties, autoCreate) {
  let value;
  if (typeof prop !== "string") {
    value = obj[prop];
  } else if (prop.startsWith("~{") && prop.endsWith("}")) {
    switch (prop) {
      case KEYS:
        return Object.keys(obj ?? {});
      case VALUES:
        return Object.values(obj ?? {});
      default:
        return obj[translateValue(prop, properties)];
    }
  } else {
    value = obj[prop];
  }
  if (value === undefined && autoCreate) {
    value = obj[prop] = {};
  }
  return value;
}
function markUpdateConfirmed(update, now) {
  if (!update.confirmed) {
    update.confirmed = now;
  }
}
// ../../NAPL/node_modules/@dobuki/data-blob/dist/index.js
var Yn = Object.create;
var { defineProperty: Rt, getPrototypeOf: En, getOwnPropertyNames: In } = Object;
var Nn = Object.prototype.hasOwnProperty;
var xn = (n, t, i) => {
  i = n != null ? Yn(En(n)) : {};
  let r = t || !n || !n.__esModule ? Rt(i, "default", { value: n, enumerable: true }) : i;
  for (let m of In(n))
    if (!Nn.call(r, m))
      Rt(r, m, { get: () => n[m], enumerable: true });
  return r;
};
var b = (n, t) => () => (t || n((t = { exports: {} }).exports, t), t.exports);
var jn = b((n, t) => {
  var i = function(x) {
    throw { name: "SyntaxError", message: x, at: g, text: N };
  }, r = function(x) {
    if (x && x !== h)
      i("Expected '" + x + "' instead of '" + h + "'");
    return h = N.charAt(g), g += 1, h;
  }, m = function() {
    var x, v = "";
    if (h === "-")
      v = "-", r("-");
    while (h >= "0" && h <= "9")
      v += h, r();
    if (h === ".") {
      v += ".";
      while (r() && h >= "0" && h <= "9")
        v += h;
    }
    if (h === "e" || h === "E") {
      if (v += h, r(), h === "-" || h === "+")
        v += h, r();
      while (h >= "0" && h <= "9")
        v += h, r();
    }
    if (x = Number(v), !isFinite(x))
      i("Bad number");
    return x;
  }, c = function() {
    var x, v, j = "", S;
    if (h === '"')
      while (r())
        if (h === '"')
          return r(), j;
        else if (h === "\\")
          if (r(), h === "u") {
            S = 0;
            for (v = 0;v < 4; v += 1) {
              if (x = parseInt(r(), 16), !isFinite(x))
                break;
              S = S * 16 + x;
            }
            j += String.fromCharCode(S);
          } else if (typeof Y[h] === "string")
            j += Y[h];
          else
            break;
        else
          j += h;
    i("Bad string");
  }, u = function() {
    while (h && h <= " ")
      r();
  }, I = function() {
    switch (h) {
      case "t":
        return r("t"), r("r"), r("u"), r("e"), true;
      case "f":
        return r("f"), r("a"), r("l"), r("s"), r("e"), false;
      case "n":
        return r("n"), r("u"), r("l"), r("l"), null;
      default:
        i("Unexpected '" + h + "'");
    }
  }, s = function() {
    var x = [];
    if (h === "[") {
      if (r("["), u(), h === "]")
        return r("]"), x;
      while (h) {
        if (x.push(E()), u(), h === "]")
          return r("]"), x;
        r(","), u();
      }
    }
    i("Bad array");
  }, e = function() {
    var x, v = {};
    if (h === "{") {
      if (r("{"), u(), h === "}")
        return r("}"), v;
      while (h) {
        if (x = c(), u(), r(":"), Object.prototype.hasOwnProperty.call(v, x))
          i('Duplicate key "' + x + '"');
        if (v[x] = E(), u(), h === "}")
          return r("}"), v;
        r(","), u();
      }
    }
    i("Bad object");
  }, E = function() {
    switch (u(), h) {
      case "{":
        return e();
      case "[":
        return s();
      case '"':
        return c();
      case "-":
        return m();
      default:
        return h >= "0" && h <= "9" ? m() : I();
    }
  }, g, h, Y = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: `
`, r: "\r", t: "\t" }, N;
  t.exports = function(x, v) {
    var j;
    if (N = x, g = 0, h = " ", j = E(), u(), h)
      i("Syntax error");
    return typeof v === "function" ? function S(A, T) {
      var d, R, P = A[T];
      if (P && typeof P === "object") {
        for (d in E)
          if (Object.prototype.hasOwnProperty.call(P, d))
            if (R = S(P, d), typeof R === "undefined")
              delete P[d];
            else
              P[d] = R;
      }
      return v.call(A, T, P);
    }({ "": j }, "") : j;
  };
});
var vn = b((n, t) => {
  var i = function(e) {
    return m.lastIndex = 0, m.test(e) ? '"' + e.replace(m, function(E) {
      var g = I[E];
      return typeof g === "string" ? g : "\\u" + ("0000" + E.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + e + '"';
  }, r = function(e, E) {
    var g, h, Y, N, x = c, v, j = E[e];
    if (j && typeof j === "object" && typeof j.toJSON === "function")
      j = j.toJSON(e);
    if (typeof s === "function")
      j = s.call(E, e, j);
    switch (typeof j) {
      case "string":
        return i(j);
      case "number":
        return isFinite(j) ? String(j) : "null";
      case "boolean":
      case "null":
        return String(j);
      case "object":
        if (!j)
          return "null";
        if (c += u, v = [], Object.prototype.toString.apply(j) === "[object Array]") {
          N = j.length;
          for (g = 0;g < N; g += 1)
            v[g] = r(g, j) || "null";
          return Y = v.length === 0 ? "[]" : c ? `[
` + c + v.join(`,
` + c) + `
` + x + "]" : "[" + v.join(",") + "]", c = x, Y;
        }
        if (s && typeof s === "object") {
          N = s.length;
          for (g = 0;g < N; g += 1)
            if (h = s[g], typeof h === "string") {
              if (Y = r(h, j), Y)
                v.push(i(h) + (c ? ": " : ":") + Y);
            }
        } else
          for (h in j)
            if (Object.prototype.hasOwnProperty.call(j, h)) {
              if (Y = r(h, j), Y)
                v.push(i(h) + (c ? ": " : ":") + Y);
            }
        return Y = v.length === 0 ? "{}" : c ? `{
` + c + v.join(`,
` + c) + `
` + x + "}" : "{" + v.join(",") + "}", c = x, Y;
      default:
    }
  }, m = /[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, c, u, I = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", '"': "\\\"", "\\": "\\\\" }, s;
  t.exports = function(e, E, g) {
    var h;
    if (c = "", u = "", typeof g === "number")
      for (h = 0;h < g; h += 1)
        u += " ";
    else if (typeof g === "string")
      u = g;
    if (s = E, E && typeof E !== "function" && (typeof E !== "object" || typeof E.length !== "number"))
      throw new Error("JSON.stringify");
    return r("", { "": e });
  };
});
var $n = b((n) => {
  n.parse = jn(), n.stringify = vn();
});
var Pn = b((n, t) => {
  var i = {}.toString;
  t.exports = Array.isArray || function(r) {
    return i.call(r) == "[object Array]";
  };
});
var Vt = b((n, t) => {
  var i = Object.prototype.toString;
  t.exports = function r(m) {
    var c = i.call(m), u = c === "[object Arguments]";
    if (!u)
      u = c !== "[object Array]" && m !== null && typeof m === "object" && typeof m.length === "number" && m.length >= 0 && i.call(m.callee) === "[object Function]";
    return u;
  };
});
var Sn = b((n, t) => {
  var i;
  if (!Object.keys)
    r = Object.prototype.hasOwnProperty, m = Object.prototype.toString, c = Vt(), u = Object.prototype.propertyIsEnumerable, I = !u.call({ toString: null }, "toString"), s = u.call(function() {}, "prototype"), e = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"], E = function(N) {
      var x = N.constructor;
      return x && x.prototype === N;
    }, g = { $applicationCache: true, $console: true, $external: true, $frame: true, $frameElement: true, $frames: true, $innerHeight: true, $innerWidth: true, $onmozfullscreenchange: true, $onmozfullscreenerror: true, $outerHeight: true, $outerWidth: true, $pageXOffset: true, $pageYOffset: true, $parent: true, $scrollLeft: true, $scrollTop: true, $scrollX: true, $scrollY: true, $self: true, $webkitIndexedDB: true, $webkitStorageInfo: true, $window: true }, h = function() {
      if (typeof window === "undefined")
        return false;
      for (var N in window)
        try {
          if (!g["$" + N] && r.call(window, N) && window[N] !== null && typeof window[N] === "object")
            try {
              E(window[N]);
            } catch (x) {
              return true;
            }
        } catch (x) {
          return true;
        }
      return false;
    }(), Y = function(N) {
      if (typeof window === "undefined" || !h)
        return E(N);
      try {
        return E(N);
      } catch (x) {
        return false;
      }
    }, i = function N(x) {
      var v = x !== null && typeof x === "object", j = m.call(x) === "[object Function]", S = c(x), A = v && m.call(x) === "[object String]", T = [];
      if (!v && !j && !S)
        throw new TypeError("Object.keys called on a non-object");
      var d = s && j;
      if (A && x.length > 0 && !r.call(x, 0))
        for (var R = 0;R < x.length; ++R)
          T.push(String(R));
      if (S && x.length > 0)
        for (var P = 0;P < x.length; ++P)
          T.push(String(P));
      else
        for (var H in x)
          if (!(d && H === "prototype") && r.call(x, H))
            T.push(String(H));
      if (I) {
        var U = Y(x);
        for (var a = 0;a < e.length; ++a)
          if (!(U && e[a] === "constructor") && r.call(x, e[a]))
            T.push(e[a]);
      }
      return T;
    };
  var r, m, c, u, I, s, e, E, g, h, Y;
  t.exports = i;
});
var Tn = b((n, t) => {
  var i = Array.prototype.slice, r = Vt(), m = Object.keys, c = m ? function I(s) {
    return m(s);
  } : Sn(), u = Object.keys;
  c.shim = function I() {
    if (Object.keys) {
      var s = function() {
        var e = Object.keys(arguments);
        return e && e.length === arguments.length;
      }(1, 2);
      if (!s)
        Object.keys = function e(E) {
          if (r(E))
            return u(i.call(E));
          return u(E);
        };
    } else
      Object.keys = c;
    return Object.keys || c;
  }, t.exports = c;
});
var An = b((n, t) => {
  var i = "Function.prototype.bind called on incompatible ", r = Object.prototype.toString, m = Math.max, c = "[object Function]", u = function e(E, g) {
    var h = [];
    for (var Y = 0;Y < E.length; Y += 1)
      h[Y] = E[Y];
    for (var N = 0;N < g.length; N += 1)
      h[N + E.length] = g[N];
    return h;
  }, I = function e(E, g) {
    var h = [];
    for (var Y = g || 0, N = 0;Y < E.length; Y += 1, N += 1)
      h[N] = E[Y];
    return h;
  }, s = function(e, E) {
    var g = "";
    for (var h = 0;h < e.length; h += 1)
      if (g += e[h], h + 1 < e.length)
        g += E;
    return g;
  };
  t.exports = function e(E) {
    var g = this;
    if (typeof g !== "function" || r.apply(g) !== c)
      throw new TypeError(i + g);
    var h = I(arguments, 1), Y, N = function() {
      if (this instanceof Y) {
        var A = g.apply(this, u(h, arguments));
        if (Object(A) === A)
          return A;
        return this;
      }
      return g.apply(E, u(h, arguments));
    }, x = m(0, g.length - h.length), v = [];
    for (var j = 0;j < x; j++)
      v[j] = "$" + j;
    if (Y = Function("binder", "return function (" + s(v, ",") + "){ return binder.apply(this,arguments); }")(N), g.prototype) {
      var S = function A() {};
      S.prototype = g.prototype, Y.prototype = new S, S.prototype = null;
    }
    return Y;
  };
});
var vt = b((n, t) => {
  var i = An();
  t.exports = Function.prototype.bind || i;
});
var kn = b((n, t) => {
  t.exports = Error;
});
var bn = b((n, t) => {
  t.exports = EvalError;
});
var dn = b((n, t) => {
  t.exports = RangeError;
});
var Cn = b((n, t) => {
  t.exports = ReferenceError;
});
var Ut = b((n, t) => {
  t.exports = SyntaxError;
});
var $t = b((n, t) => {
  t.exports = TypeError;
});
var On = b((n, t) => {
  t.exports = URIError;
});
var Rn = b((n, t) => {
  t.exports = function i() {
    if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function")
      return false;
    if (typeof Symbol.iterator === "symbol")
      return true;
    var r = {}, m = Symbol("test"), c = Object(m);
    if (typeof m === "string")
      return false;
    if (Object.prototype.toString.call(m) !== "[object Symbol]")
      return false;
    if (Object.prototype.toString.call(c) !== "[object Symbol]")
      return false;
    var u = 42;
    r[m] = u;
    for (m in r)
      return false;
    if (typeof Object.keys === "function" && Object.keys(r).length !== 0)
      return false;
    if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(r).length !== 0)
      return false;
    var I = Object.getOwnPropertySymbols(r);
    if (I.length !== 1 || I[0] !== m)
      return false;
    if (!Object.prototype.propertyIsEnumerable.call(r, m))
      return false;
    if (typeof Object.getOwnPropertyDescriptor === "function") {
      var s = Object.getOwnPropertyDescriptor(r, m);
      if (s.value !== u || s.enumerable !== true)
        return false;
    }
    return true;
  };
});
var Gt = b((n, t) => {
  var i = typeof Symbol !== "undefined" && Symbol, r = Rn();
  t.exports = function m() {
    if (typeof i !== "function")
      return false;
    if (typeof Symbol !== "function")
      return false;
    if (typeof i("foo") !== "symbol")
      return false;
    if (typeof Symbol("bar") !== "symbol")
      return false;
    return r();
  };
});
var Zt = b((n, t) => {
  var i = { foo: {} }, r = Object;
  t.exports = function m() {
    return { __proto__: i }.foo === i.foo && !({ __proto__: null } instanceof r);
  };
});
var at = b((n, t) => {
  var i = Function.prototype.call, r = Object.prototype.hasOwnProperty, m = vt();
  t.exports = m.call(i, r);
});
var Pt = b((n, t) => {
  var i, r = kn(), m = bn(), c = dn(), u = Cn(), I = Ut(), s = $t(), e = On(), E = Function, g = function(D) {
    try {
      return E('"use strict"; return (' + D + ").constructor;")();
    } catch (C) {}
  }, h = Object.getOwnPropertyDescriptor;
  if (h)
    try {
      h({}, "");
    } catch (D) {
      h = null;
    }
  var Y = function() {
    throw new s;
  }, N = h ? function() {
    try {
      return arguments.callee, Y;
    } catch (D) {
      try {
        return h(arguments, "callee").get;
      } catch (C) {
        return Y;
      }
    }
  }() : Y, x = Gt()(), v = Zt()(), j = Object.getPrototypeOf || (v ? function(D) {
    return D.__proto__;
  } : null), S = {}, A = typeof Uint8Array === "undefined" || !j ? i : j(Uint8Array), T = { __proto__: null, "%AggregateError%": typeof AggregateError === "undefined" ? i : AggregateError, "%Array%": Array, "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? i : ArrayBuffer, "%ArrayIteratorPrototype%": x && j ? j([][Symbol.iterator]()) : i, "%AsyncFromSyncIteratorPrototype%": i, "%AsyncFunction%": S, "%AsyncGenerator%": S, "%AsyncGeneratorFunction%": S, "%AsyncIteratorPrototype%": S, "%Atomics%": typeof Atomics === "undefined" ? i : Atomics, "%BigInt%": typeof BigInt === "undefined" ? i : BigInt, "%BigInt64Array%": typeof BigInt64Array === "undefined" ? i : BigInt64Array, "%BigUint64Array%": typeof BigUint64Array === "undefined" ? i : BigUint64Array, "%Boolean%": Boolean, "%DataView%": typeof DataView === "undefined" ? i : DataView, "%Date%": Date, "%decodeURI%": decodeURI, "%decodeURIComponent%": decodeURIComponent, "%encodeURI%": encodeURI, "%encodeURIComponent%": encodeURIComponent, "%Error%": r, "%eval%": eval, "%EvalError%": m, "%Float32Array%": typeof Float32Array === "undefined" ? i : Float32Array, "%Float64Array%": typeof Float64Array === "undefined" ? i : Float64Array, "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? i : FinalizationRegistry, "%Function%": E, "%GeneratorFunction%": S, "%Int8Array%": typeof Int8Array === "undefined" ? i : Int8Array, "%Int16Array%": typeof Int16Array === "undefined" ? i : Int16Array, "%Int32Array%": typeof Int32Array === "undefined" ? i : Int32Array, "%isFinite%": isFinite, "%isNaN%": isNaN, "%IteratorPrototype%": x && j ? j(j([][Symbol.iterator]())) : i, "%JSON%": typeof JSON === "object" ? JSON : i, "%Map%": typeof Map === "undefined" ? i : Map, "%MapIteratorPrototype%": typeof Map === "undefined" || !x || !j ? i : j(new Map()[Symbol.iterator]()), "%Math%": Math, "%Number%": Number, "%Object%": Object, "%parseFloat%": parseFloat, "%parseInt%": parseInt, "%Promise%": typeof Promise === "undefined" ? i : Promise, "%Proxy%": typeof Proxy === "undefined" ? i : Proxy, "%RangeError%": c, "%ReferenceError%": u, "%Reflect%": typeof Reflect === "undefined" ? i : Reflect, "%RegExp%": RegExp, "%Set%": typeof Set === "undefined" ? i : Set, "%SetIteratorPrototype%": typeof Set === "undefined" || !x || !j ? i : j(new Set()[Symbol.iterator]()), "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? i : SharedArrayBuffer, "%String%": String, "%StringIteratorPrototype%": x && j ? j(""[Symbol.iterator]()) : i, "%Symbol%": x ? Symbol : i, "%SyntaxError%": I, "%ThrowTypeError%": N, "%TypedArray%": A, "%TypeError%": s, "%Uint8Array%": typeof Uint8Array === "undefined" ? i : Uint8Array, "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? i : Uint8ClampedArray, "%Uint16Array%": typeof Uint16Array === "undefined" ? i : Uint16Array, "%Uint32Array%": typeof Uint32Array === "undefined" ? i : Uint32Array, "%URIError%": e, "%WeakMap%": typeof WeakMap === "undefined" ? i : WeakMap, "%WeakRef%": typeof WeakRef === "undefined" ? i : WeakRef, "%WeakSet%": typeof WeakSet === "undefined" ? i : WeakSet };
  if (j)
    try {
      null.error;
    } catch (D) {
      d = j(j(D)), T["%Error.prototype%"] = d;
    }
  var d, R = function D(C) {
    var k;
    if (C === "%AsyncFunction%")
      k = g("async function () {}");
    else if (C === "%GeneratorFunction%")
      k = g("function* () {}");
    else if (C === "%AsyncGeneratorFunction%")
      k = g("async function* () {}");
    else if (C === "%AsyncGenerator%") {
      var p = D("%AsyncGeneratorFunction%");
      if (p)
        k = p.prototype;
    } else if (C === "%AsyncIteratorPrototype%") {
      var f = D("%AsyncGenerator%");
      if (f && j)
        k = j(f.prototype);
    }
    return T[C] = k, k;
  }, P = { __proto__: null, "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"], "%ArrayPrototype%": ["Array", "prototype"], "%ArrayProto_entries%": ["Array", "prototype", "entries"], "%ArrayProto_forEach%": ["Array", "prototype", "forEach"], "%ArrayProto_keys%": ["Array", "prototype", "keys"], "%ArrayProto_values%": ["Array", "prototype", "values"], "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"], "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"], "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"], "%BooleanPrototype%": ["Boolean", "prototype"], "%DataViewPrototype%": ["DataView", "prototype"], "%DatePrototype%": ["Date", "prototype"], "%ErrorPrototype%": ["Error", "prototype"], "%EvalErrorPrototype%": ["EvalError", "prototype"], "%Float32ArrayPrototype%": ["Float32Array", "prototype"], "%Float64ArrayPrototype%": ["Float64Array", "prototype"], "%FunctionPrototype%": ["Function", "prototype"], "%Generator%": ["GeneratorFunction", "prototype"], "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"], "%Int8ArrayPrototype%": ["Int8Array", "prototype"], "%Int16ArrayPrototype%": ["Int16Array", "prototype"], "%Int32ArrayPrototype%": ["Int32Array", "prototype"], "%JSONParse%": ["JSON", "parse"], "%JSONStringify%": ["JSON", "stringify"], "%MapPrototype%": ["Map", "prototype"], "%NumberPrototype%": ["Number", "prototype"], "%ObjectPrototype%": ["Object", "prototype"], "%ObjProto_toString%": ["Object", "prototype", "toString"], "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"], "%PromisePrototype%": ["Promise", "prototype"], "%PromiseProto_then%": ["Promise", "prototype", "then"], "%Promise_all%": ["Promise", "all"], "%Promise_reject%": ["Promise", "reject"], "%Promise_resolve%": ["Promise", "resolve"], "%RangeErrorPrototype%": ["RangeError", "prototype"], "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"], "%RegExpPrototype%": ["RegExp", "prototype"], "%SetPrototype%": ["Set", "prototype"], "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"], "%StringPrototype%": ["String", "prototype"], "%SymbolPrototype%": ["Symbol", "prototype"], "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"], "%TypedArrayPrototype%": ["TypedArray", "prototype"], "%TypeErrorPrototype%": ["TypeError", "prototype"], "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"], "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"], "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"], "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"], "%URIErrorPrototype%": ["URIError", "prototype"], "%WeakMapPrototype%": ["WeakMap", "prototype"], "%WeakSetPrototype%": ["WeakSet", "prototype"] }, H = vt(), U = at(), a = H.call(Function.call, Array.prototype.concat), G = H.call(Function.apply, Array.prototype.splice), rt = H.call(Function.call, String.prototype.replace), X = H.call(Function.call, String.prototype.slice), L = H.call(Function.call, RegExp.prototype.exec), O = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, M = /\\(\\)?/g, W = function D(C) {
    var k = X(C, 0, 1), p = X(C, -1);
    if (k === "%" && p !== "%")
      throw new I("invalid intrinsic syntax, expected closing `%`");
    else if (p === "%" && k !== "%")
      throw new I("invalid intrinsic syntax, expected opening `%`");
    var f = [];
    return rt(C, O, function(V, Z, o, z) {
      f[f.length] = o ? rt(z, M, "$1") : Z || V;
    }), f;
  }, l = function D(C, k) {
    var p = C, f;
    if (U(P, p))
      f = P[p], p = "%" + f[0] + "%";
    if (U(T, p)) {
      var V = T[p];
      if (V === S)
        V = R(p);
      if (typeof V === "undefined" && !k)
        throw new s("intrinsic " + C + " exists, but is not available. Please file an issue!");
      return { alias: f, name: p, value: V };
    }
    throw new I("intrinsic " + C + " does not exist!");
  };
  t.exports = function D(C, k) {
    if (typeof C !== "string" || C.length === 0)
      throw new s("intrinsic name must be a non-empty string");
    if (arguments.length > 1 && typeof k !== "boolean")
      throw new s('"allowMissing" argument must be a boolean');
    if (L(/^%?[^%]*%?$/, C) === null)
      throw new I("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    var p = W(C), f = p.length > 0 ? p[0] : "", V = l("%" + f + "%", k), Z = V.name, o = V.value, z = false, nt = V.alias;
    if (nt)
      f = nt[0], G(p, a([0, 1], nt));
    for (var _ = 1, ct = true;_ < p.length; _ += 1) {
      var J = p[_], Yt = X(J, 0, 1), Et = X(J, -1);
      if ((Yt === '"' || Yt === "'" || Yt === "`" || (Et === '"' || Et === "'" || Et === "`")) && Yt !== Et)
        throw new I("property names with quotes must have matching quotes");
      if (J === "constructor" || !ct)
        z = true;
      if (f += "." + J, Z = "%" + f + "%", U(T, Z))
        o = T[Z];
      else if (o != null) {
        if (!(J in o)) {
          if (!k)
            throw new s("base intrinsic for " + C + " exists, but the property is not available.");
          return;
        }
        if (h && _ + 1 >= p.length) {
          var It = h(o, J);
          if (ct = !!It, ct && "get" in It && !("originalValue" in It.get))
            o = It.get;
          else
            o = o[J];
        } else
          ct = U(o, J), o = o[J];
        if (ct && !z)
          T[Z] = o;
      }
    }
    return o;
  };
});
var At = b((n, t) => {
  var i = Pt(), r = i("%Object.defineProperty%", true) || false;
  if (r)
    try {
      r({}, "a", { value: 1 });
    } catch (m) {
      r = false;
    }
  t.exports = r;
});
var pn = b((n, t) => {
  var i, r = SyntaxError, m = Function, c = TypeError, u = function(L) {
    try {
      return m('"use strict"; return (' + L + ").constructor;")();
    } catch (O) {}
  }, I = Object.getOwnPropertyDescriptor;
  if (I)
    try {
      I({}, "");
    } catch (L) {
      I = null;
    }
  var s = function() {
    throw new c;
  }, e = I ? function() {
    try {
      return arguments.callee, s;
    } catch (L) {
      try {
        return I(arguments, "callee").get;
      } catch (O) {
        return s;
      }
    }
  }() : s, E = Gt()(), g = Zt()(), h = Object.getPrototypeOf || (g ? function(L) {
    return L.__proto__;
  } : null), Y = {}, N = typeof Uint8Array === "undefined" || !h ? i : h(Uint8Array), x = { "%AggregateError%": typeof AggregateError === "undefined" ? i : AggregateError, "%Array%": Array, "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? i : ArrayBuffer, "%ArrayIteratorPrototype%": E && h ? h([][Symbol.iterator]()) : i, "%AsyncFromSyncIteratorPrototype%": i, "%AsyncFunction%": Y, "%AsyncGenerator%": Y, "%AsyncGeneratorFunction%": Y, "%AsyncIteratorPrototype%": Y, "%Atomics%": typeof Atomics === "undefined" ? i : Atomics, "%BigInt%": typeof BigInt === "undefined" ? i : BigInt, "%BigInt64Array%": typeof BigInt64Array === "undefined" ? i : BigInt64Array, "%BigUint64Array%": typeof BigUint64Array === "undefined" ? i : BigUint64Array, "%Boolean%": Boolean, "%DataView%": typeof DataView === "undefined" ? i : DataView, "%Date%": Date, "%decodeURI%": decodeURI, "%decodeURIComponent%": decodeURIComponent, "%encodeURI%": encodeURI, "%encodeURIComponent%": encodeURIComponent, "%Error%": Error, "%eval%": eval, "%EvalError%": EvalError, "%Float32Array%": typeof Float32Array === "undefined" ? i : Float32Array, "%Float64Array%": typeof Float64Array === "undefined" ? i : Float64Array, "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? i : FinalizationRegistry, "%Function%": m, "%GeneratorFunction%": Y, "%Int8Array%": typeof Int8Array === "undefined" ? i : Int8Array, "%Int16Array%": typeof Int16Array === "undefined" ? i : Int16Array, "%Int32Array%": typeof Int32Array === "undefined" ? i : Int32Array, "%isFinite%": isFinite, "%isNaN%": isNaN, "%IteratorPrototype%": E && h ? h(h([][Symbol.iterator]())) : i, "%JSON%": typeof JSON === "object" ? JSON : i, "%Map%": typeof Map === "undefined" ? i : Map, "%MapIteratorPrototype%": typeof Map === "undefined" || !E || !h ? i : h(new Map()[Symbol.iterator]()), "%Math%": Math, "%Number%": Number, "%Object%": Object, "%parseFloat%": parseFloat, "%parseInt%": parseInt, "%Promise%": typeof Promise === "undefined" ? i : Promise, "%Proxy%": typeof Proxy === "undefined" ? i : Proxy, "%RangeError%": RangeError, "%ReferenceError%": ReferenceError, "%Reflect%": typeof Reflect === "undefined" ? i : Reflect, "%RegExp%": RegExp, "%Set%": typeof Set === "undefined" ? i : Set, "%SetIteratorPrototype%": typeof Set === "undefined" || !E || !h ? i : h(new Set()[Symbol.iterator]()), "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? i : SharedArrayBuffer, "%String%": String, "%StringIteratorPrototype%": E && h ? h(""[Symbol.iterator]()) : i, "%Symbol%": E ? Symbol : i, "%SyntaxError%": r, "%ThrowTypeError%": e, "%TypedArray%": N, "%TypeError%": c, "%Uint8Array%": typeof Uint8Array === "undefined" ? i : Uint8Array, "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? i : Uint8ClampedArray, "%Uint16Array%": typeof Uint16Array === "undefined" ? i : Uint16Array, "%Uint32Array%": typeof Uint32Array === "undefined" ? i : Uint32Array, "%URIError%": URIError, "%WeakMap%": typeof WeakMap === "undefined" ? i : WeakMap, "%WeakRef%": typeof WeakRef === "undefined" ? i : WeakRef, "%WeakSet%": typeof WeakSet === "undefined" ? i : WeakSet };
  if (h)
    try {
      null.error;
    } catch (L) {
      v = h(h(L)), x["%Error.prototype%"] = v;
    }
  var v, j = function L(O) {
    var M;
    if (O === "%AsyncFunction%")
      M = u("async function () {}");
    else if (O === "%GeneratorFunction%")
      M = u("function* () {}");
    else if (O === "%AsyncGeneratorFunction%")
      M = u("async function* () {}");
    else if (O === "%AsyncGenerator%") {
      var W = L("%AsyncGeneratorFunction%");
      if (W)
        M = W.prototype;
    } else if (O === "%AsyncIteratorPrototype%") {
      var l = L("%AsyncGenerator%");
      if (l && h)
        M = h(l.prototype);
    }
    return x[O] = M, M;
  }, S = { "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"], "%ArrayPrototype%": ["Array", "prototype"], "%ArrayProto_entries%": ["Array", "prototype", "entries"], "%ArrayProto_forEach%": ["Array", "prototype", "forEach"], "%ArrayProto_keys%": ["Array", "prototype", "keys"], "%ArrayProto_values%": ["Array", "prototype", "values"], "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"], "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"], "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"], "%BooleanPrototype%": ["Boolean", "prototype"], "%DataViewPrototype%": ["DataView", "prototype"], "%DatePrototype%": ["Date", "prototype"], "%ErrorPrototype%": ["Error", "prototype"], "%EvalErrorPrototype%": ["EvalError", "prototype"], "%Float32ArrayPrototype%": ["Float32Array", "prototype"], "%Float64ArrayPrototype%": ["Float64Array", "prototype"], "%FunctionPrototype%": ["Function", "prototype"], "%Generator%": ["GeneratorFunction", "prototype"], "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"], "%Int8ArrayPrototype%": ["Int8Array", "prototype"], "%Int16ArrayPrototype%": ["Int16Array", "prototype"], "%Int32ArrayPrototype%": ["Int32Array", "prototype"], "%JSONParse%": ["JSON", "parse"], "%JSONStringify%": ["JSON", "stringify"], "%MapPrototype%": ["Map", "prototype"], "%NumberPrototype%": ["Number", "prototype"], "%ObjectPrototype%": ["Object", "prototype"], "%ObjProto_toString%": ["Object", "prototype", "toString"], "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"], "%PromisePrototype%": ["Promise", "prototype"], "%PromiseProto_then%": ["Promise", "prototype", "then"], "%Promise_all%": ["Promise", "all"], "%Promise_reject%": ["Promise", "reject"], "%Promise_resolve%": ["Promise", "resolve"], "%RangeErrorPrototype%": ["RangeError", "prototype"], "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"], "%RegExpPrototype%": ["RegExp", "prototype"], "%SetPrototype%": ["Set", "prototype"], "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"], "%StringPrototype%": ["String", "prototype"], "%SymbolPrototype%": ["Symbol", "prototype"], "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"], "%TypedArrayPrototype%": ["TypedArray", "prototype"], "%TypeErrorPrototype%": ["TypeError", "prototype"], "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"], "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"], "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"], "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"], "%URIErrorPrototype%": ["URIError", "prototype"], "%WeakMapPrototype%": ["WeakMap", "prototype"], "%WeakSetPrototype%": ["WeakSet", "prototype"] }, A = vt(), T = at(), d = A.call(Function.call, Array.prototype.concat), R = A.call(Function.apply, Array.prototype.splice), P = A.call(Function.call, String.prototype.replace), H = A.call(Function.call, String.prototype.slice), U = A.call(Function.call, RegExp.prototype.exec), a = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, G = /\\(\\)?/g, rt = function L(O) {
    var M = H(O, 0, 1), W = H(O, -1);
    if (M === "%" && W !== "%")
      throw new r("invalid intrinsic syntax, expected closing `%`");
    else if (W === "%" && M !== "%")
      throw new r("invalid intrinsic syntax, expected opening `%`");
    var l = [];
    return P(O, a, function(D, C, k, p) {
      l[l.length] = k ? P(p, G, "$1") : C || D;
    }), l;
  }, X = function L(O, M) {
    var W = O, l;
    if (T(S, W))
      l = S[W], W = "%" + l[0] + "%";
    if (T(x, W)) {
      var D = x[W];
      if (D === Y)
        D = j(W);
      if (typeof D === "undefined" && !M)
        throw new c("intrinsic " + O + " exists, but is not available. Please file an issue!");
      return { alias: l, name: W, value: D };
    }
    throw new r("intrinsic " + O + " does not exist!");
  };
  t.exports = function L(O, M) {
    if (typeof O !== "string" || O.length === 0)
      throw new c("intrinsic name must be a non-empty string");
    if (arguments.length > 1 && typeof M !== "boolean")
      throw new c('"allowMissing" argument must be a boolean');
    if (U(/^%?[^%]*%?$/, O) === null)
      throw new r("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    var W = rt(O), l = W.length > 0 ? W[0] : "", D = X("%" + l + "%", M), C = D.name, k = D.value, p = false, f = D.alias;
    if (f)
      l = f[0], R(W, d([0, 1], f));
    for (var V = 1, Z = true;V < W.length; V += 1) {
      var o = W[V], z = H(o, 0, 1), nt = H(o, -1);
      if ((z === '"' || z === "'" || z === "`" || (nt === '"' || nt === "'" || nt === "`")) && z !== nt)
        throw new r("property names with quotes must have matching quotes");
      if (o === "constructor" || !Z)
        p = true;
      if (l += "." + o, C = "%" + l + "%", T(x, C))
        k = x[C];
      else if (k != null) {
        if (!(o in k)) {
          if (!M)
            throw new c("base intrinsic for " + O + " exists, but the property is not available.");
          return;
        }
        if (I && V + 1 >= W.length) {
          var _ = I(k, o);
          if (Z = !!_, Z && "get" in _ && !("originalValue" in _.get))
            k = _.get;
          else
            k = k[o];
        } else
          Z = T(k, o), k = k[o];
        if (Z && !p)
          x[C] = k;
      }
    }
    return k;
  };
});
var Ft = b((n, t) => {
  var i = pn(), r = i("%Object.getOwnPropertyDescriptor%", true);
  if (r)
    try {
      r([], "length");
    } catch (m) {
      r = null;
    }
  t.exports = r;
});
var Dn = b((n, t) => {
  var i = At(), r = Ut(), m = $t(), c = Ft();
  t.exports = function u(I, s, e) {
    if (!I || typeof I !== "object" && typeof I !== "function")
      throw new m("`obj` must be an object or a function`");
    if (typeof s !== "string" && typeof s !== "symbol")
      throw new m("`property` must be a string or a symbol`");
    if (arguments.length > 3 && typeof arguments[3] !== "boolean" && arguments[3] !== null)
      throw new m("`nonEnumerable`, if provided, must be a boolean or null");
    if (arguments.length > 4 && typeof arguments[4] !== "boolean" && arguments[4] !== null)
      throw new m("`nonWritable`, if provided, must be a boolean or null");
    if (arguments.length > 5 && typeof arguments[5] !== "boolean" && arguments[5] !== null)
      throw new m("`nonConfigurable`, if provided, must be a boolean or null");
    if (arguments.length > 6 && typeof arguments[6] !== "boolean")
      throw new m("`loose`, if provided, must be a boolean");
    var E = arguments.length > 3 ? arguments[3] : null, g = arguments.length > 4 ? arguments[4] : null, h = arguments.length > 5 ? arguments[5] : null, Y = arguments.length > 6 ? arguments[6] : false, N = !!c && c(I, s);
    if (i)
      i(I, s, { configurable: h === null && N ? N.configurable : !h, enumerable: E === null && N ? N.enumerable : !E, value: e, writable: g === null && N ? N.writable : !g });
    else if (Y || !E && !g && !h)
      I[s] = e;
    else
      throw new r("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
  };
});
var on = b((n, t) => {
  var i = At(), r = function m() {
    return !!i;
  };
  r.hasArrayLengthDefineBug = function m() {
    if (!i)
      return null;
    try {
      return i([], "length", { value: 1 }).length !== 1;
    } catch (c) {
      return true;
    }
  }, t.exports = r;
});
var Wn = b((n, t) => {
  var i = Pt(), r = Dn(), m = on()(), c = Ft(), u = $t(), I = i("%Math.floor%");
  t.exports = function s(e, E) {
    if (typeof e !== "function")
      throw new u("`fn` is not a function");
    if (typeof E !== "number" || E < 0 || E > 4294967295 || I(E) !== E)
      throw new u("`length` must be a positive 32-bit integer");
    var g = arguments.length > 2 && !!arguments[2], h = true, Y = true;
    if ("length" in e && c) {
      var N = c(e, "length");
      if (N && !N.configurable)
        h = false;
      if (N && !N.writable)
        Y = false;
    }
    if (h || Y || !g)
      if (m)
        r(e, "length", E, true, true);
      else
        r(e, "length", E);
    return e;
  };
});
var Bt = b((n, t) => {
  var i = vt(), r = Pt(), m = Wn(), c = $t(), u = r("%Function.prototype.apply%"), I = r("%Function.prototype.call%"), s = r("%Reflect.apply%", true) || i.call(I, u), e = At(), E = r("%Math.max%");
  t.exports = function h(Y) {
    if (typeof Y !== "function")
      throw new c("a function is required");
    var N = s(i, I, arguments);
    return m(N, 1 + E(0, Y.length - (arguments.length - 1)), true);
  };
  var g = function h() {
    return s(i, u, arguments);
  };
  if (e)
    e(t.exports, "apply", { value: g });
  else
    t.exports.apply = g;
});
var Ln = b((n, t) => {
  var i = Pt(), r = Bt(), m = r(i("String.prototype.indexOf"));
  t.exports = function c(u, I) {
    var s = i(u, !!I);
    if (typeof s === "function" && m(u, ".prototype.") > -1)
      return r(s);
    return s;
  };
});
var Mn = b((n, t) => {
  var i = (typeof JSON !== "undefined" ? JSON : $n()).stringify, r = Pn(), m = Tn(), c = Bt(), u = Ln(), I = u("Array.prototype.join"), s = u("Array.prototype.push"), e = function g(h, Y) {
    var N = "";
    for (var x = 0;x < h; x += 1)
      N += Y;
    return N;
  }, E = function(g, h, Y) {
    return Y;
  };
  t.exports = function g(h) {
    var Y = arguments.length > 1 ? arguments[1] : undefined, N = Y && Y.space || "";
    if (typeof N === "number")
      N = e(N, " ");
    var x = !!Y && typeof Y.cycles === "boolean" && Y.cycles, v = Y && Y.replacer ? c(Y.replacer) : E, j = typeof Y === "function" ? Y : Y && Y.cmp, S = j && function(T) {
      var d = j.length > 2 && function R(P) {
        return T[P];
      };
      return function(R, P) {
        return j({ key: R, value: T[R] }, { key: P, value: T[P] }, d ? { __proto__: null, get: d } : undefined);
      };
    }, A = [];
    return function T(d, R, P, H) {
      var U = N ? `
` + e(H, N) : "", a = N ? ": " : ":";
      if (P && P.toJSON && typeof P.toJSON === "function")
        P = P.toJSON();
      if (P = v(d, R, P), P === undefined)
        return;
      if (typeof P !== "object" || P === null)
        return i(P);
      if (r(P)) {
        var L = [];
        for (var G = 0;G < P.length; G++) {
          var rt = T(P, G, P[G], H + 1) || i(null);
          s(L, U + N + rt);
        }
        return "[" + I(L, ",") + U + "]";
      }
      if (A.indexOf(P) !== -1) {
        if (x)
          return i("__cycle__");
        throw new TypeError("Converting circular structure to JSON");
      } else
        s(A, P);
      var X = m(P).sort(S && S(P)), L = [];
      for (var G = 0;G < X.length; G++) {
        var R = X[G], O = T(P, R, P[R], H + 1);
        if (!O)
          continue;
        var M = i(R) + a + O;
        s(L, U + N + M);
      }
      return A.splice(A.indexOf(P), 1), "{" + I(L, ",") + U + "}";
    }({ "": h }, "", h, 0);
  };
});
var pt = xn(Mn(), 1);
var Dt = function(n, t, i, r) {
  let m, c, u, I = t || [0], s = (i = i || 0) >>> 3, e = r === -1 ? 3 : 0;
  for (m = 0;m < n.length; m += 1)
    u = m + s, c = u >>> 2, I.length <= c && I.push(0), I[c] |= n[m] << 8 * (e + r * (u % 4));
  return { value: I, binLen: 8 * n.length + i };
};
var ht = function(n, t, i) {
  switch (t) {
    case "UTF8":
    case "UTF16BE":
    case "UTF16LE":
      break;
    default:
      throw new Error("encoding must be UTF8, UTF16BE, or UTF16LE");
  }
  switch (n) {
    case "HEX":
      return function(r, m, c) {
        return function(u, I, s, e) {
          let E, g, h, Y;
          if (u.length % 2 != 0)
            throw new Error("String of HEX type must be in byte increments");
          let N = I || [0], x = (s = s || 0) >>> 3, v = e === -1 ? 3 : 0;
          for (E = 0;E < u.length; E += 2) {
            if (g = parseInt(u.substr(E, 2), 16), isNaN(g))
              throw new Error("String of HEX type contains invalid characters");
            for (Y = (E >>> 1) + x, h = Y >>> 2;N.length <= h; )
              N.push(0);
            N[h] |= g << 8 * (v + e * (Y % 4));
          }
          return { value: N, binLen: 4 * u.length + s };
        }(r, m, c, i);
      };
    case "TEXT":
      return function(r, m, c) {
        return function(u, I, s, e, E) {
          let g, h, Y, N, x, v, j, S, A = 0, T = s || [0], d = (e = e || 0) >>> 3;
          if (I === "UTF8")
            for (j = E === -1 ? 3 : 0, Y = 0;Y < u.length; Y += 1)
              for (g = u.charCodeAt(Y), h = [], 128 > g ? h.push(g) : 2048 > g ? (h.push(192 | g >>> 6), h.push(128 | 63 & g)) : 55296 > g || 57344 <= g ? h.push(224 | g >>> 12, 128 | g >>> 6 & 63, 128 | 63 & g) : (Y += 1, g = 65536 + ((1023 & g) << 10 | 1023 & u.charCodeAt(Y)), h.push(240 | g >>> 18, 128 | g >>> 12 & 63, 128 | g >>> 6 & 63, 128 | 63 & g)), N = 0;N < h.length; N += 1) {
                for (v = A + d, x = v >>> 2;T.length <= x; )
                  T.push(0);
                T[x] |= h[N] << 8 * (j + E * (v % 4)), A += 1;
              }
          else
            for (j = E === -1 ? 2 : 0, S = I === "UTF16LE" && E !== 1 || I !== "UTF16LE" && E === 1, Y = 0;Y < u.length; Y += 1) {
              for (g = u.charCodeAt(Y), S === true && (N = 255 & g, g = N << 8 | g >>> 8), v = A + d, x = v >>> 2;T.length <= x; )
                T.push(0);
              T[x] |= g << 8 * (j + E * (v % 4)), A += 2;
            }
          return { value: T, binLen: 8 * A + e };
        }(r, t, m, c, i);
      };
    case "B64":
      return function(r, m, c) {
        return function(u, I, s, e) {
          let E, g, h, Y, N, x, v, j = 0, S = I || [0], A = (s = s || 0) >>> 3, T = e === -1 ? 3 : 0, d = u.indexOf("=");
          if (u.search(/^[a-zA-Z0-9=+/]+$/) === -1)
            throw new Error("Invalid character in base-64 string");
          if (u = u.replace(/=/g, ""), d !== -1 && d < u.length)
            throw new Error("Invalid '=' found in base-64 string");
          for (g = 0;g < u.length; g += 4) {
            for (N = u.substr(g, 4), Y = 0, h = 0;h < N.length; h += 1)
              E = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(N.charAt(h)), Y |= E << 18 - 6 * h;
            for (h = 0;h < N.length - 1; h += 1) {
              for (v = j + A, x = v >>> 2;S.length <= x; )
                S.push(0);
              S[x] |= (Y >>> 16 - 8 * h & 255) << 8 * (T + e * (v % 4)), j += 1;
            }
          }
          return { value: S, binLen: 8 * j + s };
        }(r, m, c, i);
      };
    case "BYTES":
      return function(r, m, c) {
        return function(u, I, s, e) {
          let E, g, h, Y, N = I || [0], x = (s = s || 0) >>> 3, v = e === -1 ? 3 : 0;
          for (g = 0;g < u.length; g += 1)
            E = u.charCodeAt(g), Y = g + x, h = Y >>> 2, N.length <= h && N.push(0), N[h] |= E << 8 * (v + e * (Y % 4));
          return { value: N, binLen: 8 * u.length + s };
        }(r, m, c, i);
      };
    case "ARRAYBUFFER":
      try {
        new ArrayBuffer(0);
      } catch (r) {
        throw new Error("ARRAYBUFFER not supported by this environment");
      }
      return function(r, m, c) {
        return function(u, I, s, e) {
          return Dt(new Uint8Array(u), I, s, e);
        }(r, m, c, i);
      };
    case "UINT8ARRAY":
      try {
        new Uint8Array(0);
      } catch (r) {
        throw new Error("UINT8ARRAY not supported by this environment");
      }
      return function(r, m, c) {
        return Dt(r, m, c, i);
      };
    default:
      throw new Error("format must be HEX, TEXT, B64, BYTES, ARRAYBUFFER, or UINT8ARRAY");
  }
};
var ot = function(n, t, i, r) {
  switch (n) {
    case "HEX":
      return function(m) {
        return function(c, u, I, s) {
          let e, E, g = "", h = u / 8, Y = I === -1 ? 3 : 0;
          for (e = 0;e < h; e += 1)
            E = c[e >>> 2] >>> 8 * (Y + I * (e % 4)), g += "0123456789abcdef".charAt(E >>> 4 & 15) + "0123456789abcdef".charAt(15 & E);
          return s.outputUpper ? g.toUpperCase() : g;
        }(m, t, i, r);
      };
    case "B64":
      return function(m) {
        return function(c, u, I, s) {
          let e, E, g, h, Y, N = "", x = u / 8, v = I === -1 ? 3 : 0;
          for (e = 0;e < x; e += 3)
            for (h = e + 1 < x ? c[e + 1 >>> 2] : 0, Y = e + 2 < x ? c[e + 2 >>> 2] : 0, g = (c[e >>> 2] >>> 8 * (v + I * (e % 4)) & 255) << 16 | (h >>> 8 * (v + I * ((e + 1) % 4)) & 255) << 8 | Y >>> 8 * (v + I * ((e + 2) % 4)) & 255, E = 0;E < 4; E += 1)
              N += 8 * e + 6 * E <= u ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(g >>> 6 * (3 - E) & 63) : s.b64Pad;
          return N;
        }(m, t, i, r);
      };
    case "BYTES":
      return function(m) {
        return function(c, u, I) {
          let s, e, E = "", g = u / 8, h = I === -1 ? 3 : 0;
          for (s = 0;s < g; s += 1)
            e = c[s >>> 2] >>> 8 * (h + I * (s % 4)) & 255, E += String.fromCharCode(e);
          return E;
        }(m, t, i);
      };
    case "ARRAYBUFFER":
      try {
        new ArrayBuffer(0);
      } catch (m) {
        throw new Error("ARRAYBUFFER not supported by this environment");
      }
      return function(m) {
        return function(c, u, I) {
          let s, e = u / 8, E = new ArrayBuffer(e), g = new Uint8Array(E), h = I === -1 ? 3 : 0;
          for (s = 0;s < e; s += 1)
            g[s] = c[s >>> 2] >>> 8 * (h + I * (s % 4)) & 255;
          return E;
        }(m, t, i);
      };
    case "UINT8ARRAY":
      try {
        new Uint8Array(0);
      } catch (m) {
        throw new Error("UINT8ARRAY not supported by this environment");
      }
      return function(m) {
        return function(c, u, I) {
          let s, e = u / 8, E = I === -1 ? 3 : 0, g = new Uint8Array(e);
          for (s = 0;s < e; s += 1)
            g[s] = c[s >>> 2] >>> 8 * (E + I * (s % 4)) & 255;
          return g;
        }(m, t, i);
      };
    default:
      throw new Error("format must be HEX, B64, BYTES, ARRAYBUFFER, or UINT8ARRAY");
  }
};
var jt = function(n, t) {
  let i, r, m = n.binLen >>> 3, c = t.binLen >>> 3, u = m << 3, I = 4 - m << 3;
  if (m % 4 != 0) {
    for (i = 0;i < c; i += 4)
      r = m + i >>> 2, n.value[r] |= t.value[i >>> 2] << u, n.value.push(0), n.value[r + 1] |= t.value[i >>> 2] >>> I;
    return (n.value.length << 2) - 4 >= c + m && n.value.pop(), { value: n.value, binLen: n.binLen + t.binLen };
  }
  return { value: n.value.concat(t.value), binLen: n.binLen + t.binLen };
};
var Wt = function(n) {
  let t = { outputUpper: false, b64Pad: "=", outputLen: -1 }, i = n || {};
  if (t.outputUpper = i.outputUpper || false, i.b64Pad && (t.b64Pad = i.b64Pad), i.outputLen) {
    if (i.outputLen % 8 != 0)
      throw new Error("Output length must be a multiple of 8");
    t.outputLen = i.outputLen;
  } else if (i.shakeLen) {
    if (i.shakeLen % 8 != 0)
      throw new Error("Output length must be a multiple of 8");
    t.outputLen = i.shakeLen;
  }
  if (typeof t.outputUpper != "boolean")
    throw new Error("Invalid outputUpper formatting option");
  if (typeof t.b64Pad != "string")
    throw new Error("Invalid b64Pad formatting option");
  return t;
};
var it = function(n, t, i, r) {
  let m = n + " must include a value and format";
  if (!t) {
    if (!r)
      throw new Error(m);
    return r;
  }
  if (t.value === undefined || !t.format)
    throw new Error(m);
  return ht(t.format, t.encoding || "UTF8", i)(t.value);
};
var mt = function(n, t) {
  return n << t | n >>> 32 - t;
};
var B = function(n, t) {
  return n >>> t | n << 32 - t;
};
var Qt = function(n, t) {
  return n >>> t;
};
var Lt = function(n, t, i) {
  return n ^ t ^ i;
};
var Xt = function(n, t, i) {
  return n & t ^ ~n & i;
};
var zt = function(n, t, i) {
  return n & t ^ n & i ^ t & i;
};
var fn = function(n) {
  return B(n, 2) ^ B(n, 13) ^ B(n, 22);
};
var K = function(n, t) {
  let i = (65535 & n) + (65535 & t);
  return (65535 & (n >>> 16) + (t >>> 16) + (i >>> 16)) << 16 | 65535 & i;
};
var Hn = function(n, t, i, r) {
  let m = (65535 & n) + (65535 & t) + (65535 & i) + (65535 & r);
  return (65535 & (n >>> 16) + (t >>> 16) + (i >>> 16) + (r >>> 16) + (m >>> 16)) << 16 | 65535 & m;
};
var ut = function(n, t, i, r, m) {
  let c = (65535 & n) + (65535 & t) + (65535 & i) + (65535 & r) + (65535 & m);
  return (65535 & (n >>> 16) + (t >>> 16) + (i >>> 16) + (r >>> 16) + (m >>> 16) + (c >>> 16)) << 16 | 65535 & c;
};
var ln = function(n) {
  return B(n, 7) ^ B(n, 18) ^ Qt(n, 3);
};
var yn = function(n) {
  return B(n, 6) ^ B(n, 11) ^ B(n, 25);
};
var Kn = function(n) {
  return [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
};
var _t = function(n, t) {
  let i, r, m, c, u, I, s, e = [];
  for (i = t[0], r = t[1], m = t[2], c = t[3], u = t[4], s = 0;s < 80; s += 1)
    e[s] = s < 16 ? n[s] : mt(e[s - 3] ^ e[s - 8] ^ e[s - 14] ^ e[s - 16], 1), I = s < 20 ? ut(mt(i, 5), Xt(r, m, c), u, 1518500249, e[s]) : s < 40 ? ut(mt(i, 5), Lt(r, m, c), u, 1859775393, e[s]) : s < 60 ? ut(mt(i, 5), zt(r, m, c), u, 2400959708, e[s]) : ut(mt(i, 5), Lt(r, m, c), u, 3395469782, e[s]), u = c, c = m, m = mt(r, 30), r = i, i = I;
  return t[0] = K(i, t[0]), t[1] = K(r, t[1]), t[2] = K(m, t[2]), t[3] = K(c, t[3]), t[4] = K(u, t[4]), t;
};
var Vn = function(n, t, i, r) {
  let m, c = 15 + (t + 65 >>> 9 << 4), u = t + i;
  for (;n.length <= c; )
    n.push(0);
  for (n[t >>> 5] |= 128 << 24 - t % 32, n[c] = 4294967295 & u, n[c - 1] = u / st | 0, m = 0;m < n.length; m += 16)
    r = _t(n.slice(m, m + 16), r);
  return r;
};
var Mt = function(n) {
  let t;
  return t = n == "SHA-224" ? q.slice() : tt.slice(), t;
};
var ft = function(n, t) {
  let i, r, m, c, u, I, s, e, E, g, h, Y = [];
  for (i = t[0], r = t[1], m = t[2], c = t[3], u = t[4], I = t[5], s = t[6], e = t[7], h = 0;h < 64; h += 1)
    Y[h] = h < 16 ? n[h] : Hn(B(N = Y[h - 2], 17) ^ B(N, 19) ^ Qt(N, 10), Y[h - 7], ln(Y[h - 15]), Y[h - 16]), E = ut(e, yn(u), Xt(u, I, s), $[h], Y[h]), g = K(fn(i), zt(i, r, m)), e = s, s = I, I = u, u = K(c, E), c = m, m = r, r = i, i = K(E, g);
  var N;
  return t[0] = K(i, t[0]), t[1] = K(r, t[1]), t[2] = K(m, t[2]), t[3] = K(c, t[3]), t[4] = K(u, t[4]), t[5] = K(I, t[5]), t[6] = K(s, t[6]), t[7] = K(e, t[7]), t;
};
var Ht = function(n, t) {
  let i;
  return t > 32 ? (i = 64 - t, new w(n.I << t | n.N >>> i, n.N << t | n.I >>> i)) : t !== 0 ? (i = 32 - t, new w(n.N << t | n.I >>> i, n.I << t | n.N >>> i)) : n;
};
var Q = function(n, t) {
  let i;
  return t < 32 ? (i = 32 - t, new w(n.N >>> t | n.I << i, n.I >>> t | n.N << i)) : (i = 64 - t, new w(n.I >>> t | n.N << i, n.N >>> t | n.I << i));
};
var Jt = function(n, t) {
  return new w(n.N >>> t, n.I >>> t | n.N << 32 - t);
};
var Un = function(n, t, i) {
  return new w(n.N & t.N ^ n.N & i.N ^ t.N & i.N, n.I & t.I ^ n.I & i.I ^ t.I & i.I);
};
var Gn = function(n) {
  let t = Q(n, 28), i = Q(n, 34), r = Q(n, 39);
  return new w(t.N ^ i.N ^ r.N, t.I ^ i.I ^ r.I);
};
var F = function(n, t) {
  let i, r;
  i = (65535 & n.I) + (65535 & t.I), r = (n.I >>> 16) + (t.I >>> 16) + (i >>> 16);
  let m = (65535 & r) << 16 | 65535 & i;
  return i = (65535 & n.N) + (65535 & t.N) + (r >>> 16), r = (n.N >>> 16) + (t.N >>> 16) + (i >>> 16), new w((65535 & r) << 16 | 65535 & i, m);
};
var Zn = function(n, t, i, r) {
  let m, c;
  m = (65535 & n.I) + (65535 & t.I) + (65535 & i.I) + (65535 & r.I), c = (n.I >>> 16) + (t.I >>> 16) + (i.I >>> 16) + (r.I >>> 16) + (m >>> 16);
  let u = (65535 & c) << 16 | 65535 & m;
  return m = (65535 & n.N) + (65535 & t.N) + (65535 & i.N) + (65535 & r.N) + (c >>> 16), c = (n.N >>> 16) + (t.N >>> 16) + (i.N >>> 16) + (r.N >>> 16) + (m >>> 16), new w((65535 & c) << 16 | 65535 & m, u);
};
var an = function(n, t, i, r, m) {
  let c, u;
  c = (65535 & n.I) + (65535 & t.I) + (65535 & i.I) + (65535 & r.I) + (65535 & m.I), u = (n.I >>> 16) + (t.I >>> 16) + (i.I >>> 16) + (r.I >>> 16) + (m.I >>> 16) + (c >>> 16);
  let I = (65535 & u) << 16 | 65535 & c;
  return c = (65535 & n.N) + (65535 & t.N) + (65535 & i.N) + (65535 & r.N) + (65535 & m.N) + (u >>> 16), u = (n.N >>> 16) + (t.N >>> 16) + (i.N >>> 16) + (r.N >>> 16) + (m.N >>> 16) + (c >>> 16), new w((65535 & u) << 16 | 65535 & c, I);
};
var gt = function(n, t) {
  return new w(n.N ^ t.N, n.I ^ t.I);
};
var Fn = function(n) {
  let t = Q(n, 19), i = Q(n, 61), r = Jt(n, 6);
  return new w(t.N ^ i.N ^ r.N, t.I ^ i.I ^ r.I);
};
var Bn = function(n) {
  let t = Q(n, 1), i = Q(n, 8), r = Jt(n, 7);
  return new w(t.N ^ i.N ^ r.N, t.I ^ i.I ^ r.I);
};
var Qn = function(n) {
  let t = Q(n, 14), i = Q(n, 18), r = Q(n, 41);
  return new w(t.N ^ i.N ^ r.N, t.I ^ i.I ^ r.I);
};
var lt = function(n) {
  return n === "SHA-384" ? [new w(3418070365, q[0]), new w(1654270250, q[1]), new w(2438529370, q[2]), new w(355462360, q[3]), new w(1731405415, q[4]), new w(41048885895, q[5]), new w(3675008525, q[6]), new w(1203062813, q[7])] : [new w(tt[0], 4089235720), new w(tt[1], 2227873595), new w(tt[2], 4271175723), new w(tt[3], 1595750129), new w(tt[4], 2917565137), new w(tt[5], 725511199), new w(tt[6], 4215389547), new w(tt[7], 327033209)];
};
var yt = function(n, t) {
  let i, r, m, c, u, I, s, e, E, g, h, Y, N = [];
  for (i = t[0], r = t[1], m = t[2], c = t[3], u = t[4], I = t[5], s = t[6], e = t[7], h = 0;h < 80; h += 1)
    h < 16 ? (Y = 2 * h, N[h] = new w(n[Y], n[Y + 1])) : N[h] = Zn(Fn(N[h - 2]), N[h - 7], Bn(N[h - 15]), N[h - 16]), E = an(e, Qn(u), (v = I, j = s, new w((x = u).N & v.N ^ ~x.N & j.N, x.I & v.I ^ ~x.I & j.I)), Jn[h], N[h]), g = F(Gn(i), Un(i, r, m)), e = s, s = I, I = u, u = F(c, E), c = m, m = r, r = i, i = F(E, g);
  var x, v, j;
  return t[0] = F(i, t[0]), t[1] = F(r, t[1]), t[2] = F(m, t[2]), t[3] = F(c, t[3]), t[4] = F(u, t[4]), t[5] = F(I, t[5]), t[6] = F(s, t[6]), t[7] = F(e, t[7]), t;
};
var Tt = function(n) {
  let t, i = [];
  for (t = 0;t < 5; t += 1)
    i[t] = [new w(0, 0), new w(0, 0), new w(0, 0), new w(0, 0), new w(0, 0)];
  return i;
};
var Xn = function(n) {
  let t, i = [];
  for (t = 0;t < 5; t += 1)
    i[t] = n[t].slice();
  return i;
};
var Nt = function(n, t) {
  let i, r, m, c, u = [], I = [];
  if (n !== null)
    for (r = 0;r < n.length; r += 2)
      t[(r >>> 1) % 5][(r >>> 1) / 5 | 0] = gt(t[(r >>> 1) % 5][(r >>> 1) / 5 | 0], new w(n[r + 1], n[r]));
  for (i = 0;i < 24; i += 1) {
    for (c = Tt(), r = 0;r < 5; r += 1)
      u[r] = (s = t[r][0], e = t[r][1], E = t[r][2], g = t[r][3], h = t[r][4], new w(s.N ^ e.N ^ E.N ^ g.N ^ h.N, s.I ^ e.I ^ E.I ^ g.I ^ h.I));
    for (r = 0;r < 5; r += 1)
      I[r] = gt(u[(r + 4) % 5], Ht(u[(r + 1) % 5], 1));
    for (r = 0;r < 5; r += 1)
      for (m = 0;m < 5; m += 1)
        t[r][m] = gt(t[r][m], I[r]);
    for (r = 0;r < 5; r += 1)
      for (m = 0;m < 5; m += 1)
        c[m][(2 * r + 3 * m) % 5] = Ht(t[r][m], ni[r][m]);
    for (r = 0;r < 5; r += 1)
      for (m = 0;m < 5; m += 1)
        t[r][m] = gt(c[r][m], new w(~c[(r + 1) % 5][m].N & c[(r + 2) % 5][m].N, ~c[(r + 1) % 5][m].I & c[(r + 2) % 5][m].I));
    t[0][0] = gt(t[0][0], ti[i]);
  }
  var s, e, E, g, h;
  return t;
};
var qt = function(n) {
  let t, i, r = 0, m = [0, 0], c = [4294967295 & n, n / st & 2097151];
  for (t = 6;t >= 0; t--)
    i = c[t >> 2] >>> 8 * t & 255, i === 0 && r === 0 || (m[r + 1 >> 2] |= i << 8 * (r + 1), r += 1);
  return r = r !== 0 ? r : 1, m[0] |= r, { value: r + 1 > 4 ? m : [m[0]], binLen: 8 + 8 * r };
};
var St = function(n) {
  return jt(qt(n.binLen), n);
};
var Kt = function(n, t) {
  let i, r = qt(t);
  r = jt(r, n);
  let m = t >>> 2, c = (m - r.value.length % m) % m;
  for (i = 0;i < c; i++)
    r.value.push(0);
  return r.value;
};
var st = 4294967296;
var $ = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
var q = [3238371032, 914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839, 3204075428];
var tt = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];
var wt = "Chosen SHA variant is not supported";
var tn = "Cannot set numRounds with MAC";

class et {
  constructor(n, t, i) {
    let r = i || {};
    if (this.t = t, this.i = r.encoding || "UTF8", this.numRounds = r.numRounds || 1, isNaN(this.numRounds) || this.numRounds !== parseInt(this.numRounds, 10) || 1 > this.numRounds)
      throw new Error("numRounds must a integer >= 1");
    this.o = n, this.h = [], this.u = 0, this.l = false, this.A = 0, this.H = false, this.S = [], this.p = [];
  }
  update(n) {
    let t, i = 0, r = this.m >>> 5, m = this.C(n, this.h, this.u), c = m.binLen, u = m.value, I = c >>> 5;
    for (t = 0;t < I; t += r)
      i + this.m <= c && (this.U = this.v(u.slice(t, t + r), this.U), i += this.m);
    return this.A += i, this.h = u.slice(i >>> 5), this.u = c % this.m, this.l = true, this;
  }
  getHash(n, t) {
    let i, r, m = this.R, c = Wt(t);
    if (this.K) {
      if (c.outputLen === -1)
        throw new Error("Output length must be specified in options");
      m = c.outputLen;
    }
    let u = ot(n, m, this.T, c);
    if (this.H && this.g)
      return u(this.g(c));
    for (r = this.F(this.h.slice(), this.u, this.A, this.L(this.U), m), i = 1;i < this.numRounds; i += 1)
      this.K && m % 32 != 0 && (r[r.length - 1] &= 16777215 >>> 24 - m % 32), r = this.F(r, m, 0, this.B(this.o), m);
    return u(r);
  }
  setHMACKey(n, t, i) {
    if (!this.M)
      throw new Error("Variant does not support HMAC");
    if (this.l)
      throw new Error("Cannot set MAC key after calling update");
    let r = ht(t, (i || {}).encoding || "UTF8", this.T);
    this.k(r(n));
  }
  k(n) {
    let t = this.m >>> 3, i = t / 4 - 1, r;
    if (this.numRounds !== 1)
      throw new Error(tn);
    if (this.H)
      throw new Error("MAC key already set");
    for (t < n.binLen / 8 && (n.value = this.F(n.value, n.binLen, 0, this.B(this.o), this.R));n.value.length <= i; )
      n.value.push(0);
    for (r = 0;r <= i; r += 1)
      this.S[r] = 909522486 ^ n.value[r], this.p[r] = 1549556828 ^ n.value[r];
    this.U = this.v(this.S, this.U), this.A = this.m, this.H = true;
  }
  getHMAC(n, t) {
    let i = Wt(t);
    return ot(n, this.R, this.T, i)(this.Y());
  }
  Y() {
    let n;
    if (!this.H)
      throw new Error("Cannot call getHMAC without first setting MAC key");
    let t = this.F(this.h.slice(), this.u, this.A, this.L(this.U), this.R);
    return n = this.v(this.p, this.B(this.o)), n = this.F(t, this.R, this.m, n, this.R), n;
  }
}
var zn = class extends et {
  constructor(n, t, i) {
    if (n !== "SHA-1")
      throw new Error(wt);
    super(n, t, i);
    let r = i || {};
    this.M = true, this.g = this.Y, this.T = -1, this.C = ht(this.t, this.i, this.T), this.v = _t, this.L = function(m) {
      return m.slice();
    }, this.B = Kn, this.F = Vn, this.U = [1732584193, 4023233417, 2562383102, 271733878, 3285377520], this.m = 512, this.R = 160, this.K = false, r.hmacKey && this.k(it("hmacKey", r.hmacKey, this.T));
  }
};
var _n = class extends et {
  constructor(n, t, i) {
    if (n !== "SHA-224" && n !== "SHA-256")
      throw new Error(wt);
    super(n, t, i);
    let r = i || {};
    this.g = this.Y, this.M = true, this.T = -1, this.C = ht(this.t, this.i, this.T), this.v = ft, this.L = function(m) {
      return m.slice();
    }, this.B = Mt, this.F = function(m, c, u, I) {
      return function(s, e, E, g, h) {
        let Y, N, x = 15 + (e + 65 >>> 9 << 4), v = e + E;
        for (;s.length <= x; )
          s.push(0);
        for (s[e >>> 5] |= 128 << 24 - e % 32, s[x] = 4294967295 & v, s[x - 1] = v / st | 0, Y = 0;Y < s.length; Y += 16)
          g = ft(s.slice(Y, Y + 16), g);
        return N = h === "SHA-224" ? [g[0], g[1], g[2], g[3], g[4], g[5], g[6]] : g, N;
      }(m, c, u, I, n);
    }, this.U = Mt(n), this.m = 512, this.R = n === "SHA-224" ? 224 : 256, this.K = false, r.hmacKey && this.k(it("hmacKey", r.hmacKey, this.T));
  }
};

class w {
  constructor(n, t) {
    this.N = n, this.I = t;
  }
}
var Jn = [new w($[0], 3609767458), new w($[1], 602891725), new w($[2], 3964484399), new w($[3], 2173295548), new w($[4], 4081628472), new w($[5], 3053834265), new w($[6], 2937671579), new w($[7], 3664609560), new w($[8], 2734883394), new w($[9], 1164996542), new w($[10], 1323610764), new w($[11], 3590304994), new w($[12], 4068182383), new w($[13], 991336113), new w($[14], 633803317), new w($[15], 3479774868), new w($[16], 2666613458), new w($[17], 944711139), new w($[18], 2341262773), new w($[19], 2007800933), new w($[20], 1495990901), new w($[21], 1856431235), new w($[22], 3175218132), new w($[23], 2198950837), new w($[24], 3999719339), new w($[25], 766784016), new w($[26], 2566594879), new w($[27], 3203337956), new w($[28], 1034457026), new w($[29], 2466948901), new w($[30], 3758326383), new w($[31], 168717936), new w($[32], 1188179964), new w($[33], 1546045734), new w($[34], 1522805485), new w($[35], 2643833823), new w($[36], 2343527390), new w($[37], 1014477480), new w($[38], 1206759142), new w($[39], 344077627), new w($[40], 1290863460), new w($[41], 3158454273), new w($[42], 3505952657), new w($[43], 106217008), new w($[44], 3606008344), new w($[45], 1432725776), new w($[46], 1467031594), new w($[47], 851169720), new w($[48], 3100823752), new w($[49], 1363258195), new w($[50], 3750685593), new w($[51], 3785050280), new w($[52], 3318307427), new w($[53], 3812723403), new w($[54], 2003034995), new w($[55], 3602036899), new w($[56], 1575990012), new w($[57], 1125592928), new w($[58], 2716904306), new w($[59], 442776044), new w($[60], 593698344), new w($[61], 3733110249), new w($[62], 2999351573), new w($[63], 3815920427), new w(3391569614, 3928383900), new w(3515267271, 566280711), new w(3940187606, 3454069534), new w(4118630271, 4000239992), new w(116418474, 1914138554), new w(174292421, 2731055270), new w(289380356, 3203993006), new w(460393269, 320620315), new w(685471733, 587496836), new w(852142971, 1086792851), new w(1017036298, 365543100), new w(1126000580, 2618297676), new w(1288033470, 3409855158), new w(1501505948, 4234509866), new w(1607167915, 987167468), new w(1816402316, 1246189591)];
var qn = class extends et {
  constructor(n, t, i) {
    if (n !== "SHA-384" && n !== "SHA-512")
      throw new Error(wt);
    super(n, t, i);
    let r = i || {};
    this.g = this.Y, this.M = true, this.T = -1, this.C = ht(this.t, this.i, this.T), this.v = yt, this.L = function(m) {
      return m.slice();
    }, this.B = lt, this.F = function(m, c, u, I) {
      return function(s, e, E, g, h) {
        let Y, N, x = 31 + (e + 129 >>> 10 << 5), v = e + E;
        for (;s.length <= x; )
          s.push(0);
        for (s[e >>> 5] |= 128 << 24 - e % 32, s[x] = 4294967295 & v, s[x - 1] = v / st | 0, Y = 0;Y < s.length; Y += 32)
          g = yt(s.slice(Y, Y + 32), g);
        return N = h === "SHA-384" ? [g[0].N, g[0].I, g[1].N, g[1].I, g[2].N, g[2].I, g[3].N, g[3].I, g[4].N, g[4].I, g[5].N, g[5].I] : [g[0].N, g[0].I, g[1].N, g[1].I, g[2].N, g[2].I, g[3].N, g[3].I, g[4].N, g[4].I, g[5].N, g[5].I, g[6].N, g[6].I, g[7].N, g[7].I], N;
      }(m, c, u, I, n);
    }, this.U = lt(n), this.m = 1024, this.R = n === "SHA-384" ? 384 : 512, this.K = false, r.hmacKey && this.k(it("hmacKey", r.hmacKey, this.T));
  }
};
var ti = [new w(0, 1), new w(0, 32898), new w(2147483648, 32906), new w(2147483648, 2147516416), new w(0, 32907), new w(0, 2147483649), new w(2147483648, 2147516545), new w(2147483648, 32777), new w(0, 138), new w(0, 136), new w(0, 2147516425), new w(0, 2147483658), new w(0, 2147516555), new w(2147483648, 139), new w(2147483648, 32905), new w(2147483648, 32771), new w(2147483648, 32770), new w(2147483648, 128), new w(0, 32778), new w(2147483648, 2147483658), new w(2147483648, 2147516545), new w(2147483648, 32896), new w(0, 2147483649), new w(2147483648, 2147516424)];
var ni = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]];
var ii = class extends et {
  constructor(n, t, i) {
    let r = 6, m = 0;
    super(n, t, i);
    let c = i || {};
    if (this.numRounds !== 1) {
      if (c.kmacKey || c.hmacKey)
        throw new Error(tn);
      if (this.o === "CSHAKE128" || this.o === "CSHAKE256")
        throw new Error("Cannot set numRounds for CSHAKE variants");
    }
    switch (this.T = 1, this.C = ht(this.t, this.i, this.T), this.v = Nt, this.L = Xn, this.B = Tt, this.U = Tt(), this.K = false, n) {
      case "SHA3-224":
        this.m = m = 1152, this.R = 224, this.M = true, this.g = this.Y;
        break;
      case "SHA3-256":
        this.m = m = 1088, this.R = 256, this.M = true, this.g = this.Y;
        break;
      case "SHA3-384":
        this.m = m = 832, this.R = 384, this.M = true, this.g = this.Y;
        break;
      case "SHA3-512":
        this.m = m = 576, this.R = 512, this.M = true, this.g = this.Y;
        break;
      case "SHAKE128":
        r = 31, this.m = m = 1344, this.R = -1, this.K = true, this.M = false, this.g = null;
        break;
      case "SHAKE256":
        r = 31, this.m = m = 1088, this.R = -1, this.K = true, this.M = false, this.g = null;
        break;
      case "KMAC128":
        r = 4, this.m = m = 1344, this.X(i), this.R = -1, this.K = true, this.M = false, this.g = this._;
        break;
      case "KMAC256":
        r = 4, this.m = m = 1088, this.X(i), this.R = -1, this.K = true, this.M = false, this.g = this._;
        break;
      case "CSHAKE128":
        this.m = m = 1344, r = this.O(i), this.R = -1, this.K = true, this.M = false, this.g = null;
        break;
      case "CSHAKE256":
        this.m = m = 1088, r = this.O(i), this.R = -1, this.K = true, this.M = false, this.g = null;
        break;
      default:
        throw new Error(wt);
    }
    this.F = function(u, I, s, e, E) {
      return function(g, h, Y, N, x, v, j) {
        let S, A, T = 0, d = [], R = x >>> 5, P = h >>> 5;
        for (S = 0;S < P && h >= x; S += R)
          N = Nt(g.slice(S, S + R), N), h -= x;
        for (g = g.slice(S), h %= x;g.length < R; )
          g.push(0);
        for (S = h >>> 3, g[S >> 2] ^= v << S % 4 * 8, g[R - 1] ^= 2147483648, N = Nt(g, N);32 * d.length < j && (A = N[T % 5][T / 5 | 0], d.push(A.I), !(32 * d.length >= j)); )
          d.push(A.N), T += 1, 64 * T % x == 0 && (Nt(null, N), T = 0);
        return d;
      }(u, I, 0, e, m, r, E);
    }, c.hmacKey && this.k(it("hmacKey", c.hmacKey, this.T));
  }
  O(n, t) {
    let i = function(m) {
      let c = m || {};
      return { funcName: it("funcName", c.funcName, 1, { value: [], binLen: 0 }), customization: it("Customization", c.customization, 1, { value: [], binLen: 0 }) };
    }(n || {});
    t && (i.funcName = t);
    let r = jt(St(i.funcName), St(i.customization));
    if (i.customization.binLen !== 0 || i.funcName.binLen !== 0) {
      let m = Kt(r, this.m >>> 3);
      for (let c = 0;c < m.length; c += this.m >>> 5)
        this.U = this.v(m.slice(c, c + (this.m >>> 5)), this.U), this.A += this.m;
      return 4;
    }
    return 31;
  }
  X(n) {
    let t = function(r) {
      let m = r || {};
      return { kmacKey: it("kmacKey", m.kmacKey, 1), funcName: { value: [1128353099], binLen: 32 }, customization: it("Customization", m.customization, 1, { value: [], binLen: 0 }) };
    }(n || {});
    this.O(n, t.funcName);
    let i = Kt(St(t.kmacKey), this.m >>> 3);
    for (let r = 0;r < i.length; r += this.m >>> 5)
      this.U = this.v(i.slice(r, r + (this.m >>> 5)), this.U), this.A += this.m;
    this.H = true;
  }
  _(n) {
    let t = jt({ value: this.h.slice(), binLen: this.u }, function(i) {
      let r, m, c = 0, u = [0, 0], I = [4294967295 & i, i / st & 2097151];
      for (r = 6;r >= 0; r--)
        m = I[r >> 2] >>> 8 * r & 255, m === 0 && c === 0 || (u[c >> 2] |= m << 8 * c, c += 1);
      return c = c !== 0 ? c : 1, u[c >> 2] |= c << 8 * c, { value: c + 1 > 4 ? u : [u[0]], binLen: 8 + 8 * c };
    }(n.outputLen));
    return this.F(t.value, t.binLen, this.A, this.L(this.U), n.outputLen);
  }
};

class nn {
  constructor(n, t, i) {
    if (n == "SHA-1")
      this.P = new zn(n, t, i);
    else if (n == "SHA-224" || n == "SHA-256")
      this.P = new _n(n, t, i);
    else if (n == "SHA-384" || n == "SHA-512")
      this.P = new qn(n, t, i);
    else {
      if (n != "SHA3-224" && n != "SHA3-256" && n != "SHA3-384" && n != "SHA3-512" && n != "SHAKE128" && n != "SHAKE256" && n != "CSHAKE128" && n != "CSHAKE256" && n != "KMAC128" && n != "KMAC256")
        throw new Error(wt);
      this.P = new ii(n, t, i);
    }
  }
  update(n) {
    return this.P.update(n), this;
  }
  getHash(n, t) {
    return this.P.getHash(n, t);
  }
  setHMACKey(n, t, i) {
    this.P.setHMACKey(n, t, i);
  }
  getHMAC(n, t) {
    return this.P.getHMAC(n, t);
  }
}
var xt = function(n, t, i = 0) {
  let r = pt.default({ ...n, signature: undefined }), m = t.noTimeWindow ? 0 : Math.floor(Date.now() / (t.timeWindow ?? hn)) + i;
  return new nn("SHA-256", "TEXT", { encoding: "UTF8" }).update(r).update(pt.default(t)).update(`${m}`).getHash("B64");
};
function rn(n, t = {}) {
  return { ...n, signature: xt(n, t) };
}
var hn = 5000;

class kt {
  data = [];
  #t = new TextEncoder;
  static payload(n, t, i) {
    return new kt().payload(n, t, i);
  }
  static blob(n, t) {
    return new kt().blob(n, t);
  }
  #n(n) {
    let t = this.#t.encode(n), i = new Uint8Array([t.byteLength]);
    this.data.push(i.buffer), this.data.push(t.buffer);
  }
  payload(n, t, i) {
    this.#n(n);
    let r = new Uint8Array([1]);
    this.data.push(r.buffer);
    let m = JSON.stringify(i ? rn(t, { secret: i }) : t), c = this.#t.encode(m), u = new Uint32Array([c.byteLength]);
    return this.data.push(u.buffer), this.data.push(c.buffer), this;
  }
  blob(n, t) {
    this.#n(n);
    let i = new Uint8Array([2]);
    this.data.push(i.buffer);
    let r = new Uint32Array([t.size]);
    return this.data.push(r.buffer), this.data.push(t), this;
  }
  build() {
    return new Blob(this.data);
  }
}
var y = [];
for (let n = 0;n < 256; ++n)
  y.push((n + 256).toString(16).slice(1));
function cn(n, t = 0) {
  return (y[n[t + 0]] + y[n[t + 1]] + y[n[t + 2]] + y[n[t + 3]] + "-" + y[n[t + 4]] + y[n[t + 5]] + "-" + y[n[t + 6]] + y[n[t + 7]] + "-" + y[n[t + 8]] + y[n[t + 9]] + "-" + y[n[t + 10]] + y[n[t + 11]] + y[n[t + 12]] + y[n[t + 13]] + y[n[t + 14]] + y[n[t + 15]]).toLowerCase();
}
var bt;
var mi = new Uint8Array(16);
function dt() {
  if (!bt) {
    if (typeof crypto === "undefined" || !crypto.getRandomValues)
      throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");
    bt = crypto.getRandomValues.bind(crypto);
  }
  return bt(mi);
}
var hi = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var Ct = { randomUUID: hi };
function ci(n, t, i) {
  if (Ct.randomUUID && !t && !n)
    return Ct.randomUUID();
  n = n || {};
  let r = n.random ?? n.rng?.() ?? dt();
  if (r.length < 16)
    throw new Error("Random bytes length must be >= 16");
  if (r[6] = r[6] & 15 | 64, r[8] = r[8] & 63 | 128, t) {
    if (i = i || 0, i < 0 || i + 16 > t.length)
      throw new RangeError(`UUID byte range ${i}:${i + 15} is out of buffer bounds`);
    for (let m = 0;m < 16; ++m)
      t[i + m] = r[m];
    return t;
  }
  return cn(r);
}
var Ot = ci;
var sn = new TextDecoder;
function gi(n, t) {
  let [i, r] = en(n, t);
  return [sn.decode(new Uint8Array(n, r, i)), r + i];
}
function ui(n, t) {
  let [i, r] = wn(n, t);
  return [sn.decode(new Uint8Array(n, r, i)), r + i];
}
function si(n, t) {
  let [i, r] = wn(n, t);
  return [new Blob([new Uint8Array(n, r, i)], { type: "application/octet-stream" }), r + i];
}
function wn(n, t) {
  return [new Uint32Array(n.slice(t, t + Uint32Array.BYTES_PER_ELEMENT), 0, 1)[0], t + Uint32Array.BYTES_PER_ELEMENT];
}
function en(n, t) {
  return [new Uint8Array(n, t, 1)[0], t + Uint8Array.BYTES_PER_ELEMENT];
}
async function oi(n) {
  let t = {}, i = {}, r = 0, m;
  while (r < n.size) {
    m = m ?? await n.arrayBuffer();
    let [c, u] = gi(m, r);
    r = u;
    let [I, s] = en(m, r);
    switch (r = s, I) {
      case 1:
        let [e, E] = ui(m, r);
        r = E;
        try {
          t[c] = JSON.parse(e);
        } catch (Y) {
          console.error(`Error parsing JSON for key "${c}":`, Y);
        }
        break;
      case 2:
        let [g, h] = si(m, r);
        r = h, i[c] = g;
        break;
    }
  }
  return { ...t, ...i };
}
function gn(n, t) {
  if (typeof n === "object" && n instanceof Blob) {
    let r = `{blob:${Ot()}}`;
    return t[r] = n, r;
  }
  let i = n;
  if (Array.isArray(n))
    n.forEach((r, m) => {
      let c = gn(r, t);
      if (c !== n[m]) {
        if (n === i)
          n = [...n];
        n[m] = c;
      }
    });
  else if (typeof n === "object" && n)
    Object.entries(n).forEach(([r, m]) => {
      let c = gn(m, t);
      if (c !== n[r]) {
        if (n === i)
          n = { ...n };
        n[r] = c;
      }
    });
  return n;
}
function un(n, t) {
  if (typeof n === "string" && n.startsWith("{blobUrl:"))
    return URL.createObjectURL(t[n]);
  if (typeof n === "string" && n.startsWith("{blob:"))
    return t[n];
  let i = n;
  if (Array.isArray(n))
    n.forEach((r, m) => {
      let c = un(r, t);
      if (c !== r) {
        if (n === i)
          n = [...n];
        n[m] = c;
      }
    });
  else if (typeof n === "object" && n)
    Object.entries(n).forEach(([r, m]) => {
      let c = un(m, t);
      if (c !== m) {
        if (n === i)
          n = { ...n };
        n[r] = c;
      }
    });
  return n;
}

// ../../NAPL/src/cycles/data-update/blob-utils.ts
function packageUpdates(updates, blobs, secret) {
  const blobBuilder = kt.payload("payload", { updates }, secret);
  const addedBlob = new Set;
  for (let key in blobs) {
    if (!addedBlob.has(key)) {
      blobBuilder.blob(key, blobs[key]);
      addedBlob.add(key);
    }
  }
  return blobBuilder.build();
}
async function receiveBlob(blob) {
  const { payload, ...blobs } = await oi(blob);
  return { payload, blobs };
}

// ../../NAPL/src/observer/Observer.ts
class Observer {
  paths;
  observerManagger;
  multiValues;
  #partsArrays;
  #previousValues = [];
  #changeCallbacks = new Set;
  #addedElementsCallback = new Set;
  #deletedElementsCallback = new Set;
  initialized = false;
  constructor(paths, observerManagger, multiValues = false) {
    this.paths = paths;
    this.observerManagger = observerManagger;
    this.multiValues = multiValues;
    this.#partsArrays = paths.map((p) => p === undefined ? [] : p.split("/"));
    this.#previousValues = paths.map(() => {
      return;
    });
  }
  onChange(callback) {
    this.#changeCallbacks.add(callback);
    return this;
  }
  onElementsAdded(callback) {
    this.#addedElementsCallback.add(callback);
    return this;
  }
  onElementsDeleted(callback) {
    this.#deletedElementsCallback.add(callback);
    return this;
  }
  #valuesChanged(context, updates) {
    const newValues = this.paths.map((path, index) => updates && (path in updates) ? updates[path] : getLeafObject(context.root, this.#partsArrays[index], 0, false, context.properties));
    if (this.#previousValues.every((prev, index) => {
      const newValue = newValues[index];
      if (prev === newValue) {
        return true;
      }
      if (Array.isArray(prev) && Array.isArray(newValue) && prev.length === newValue.length && prev.every((elem, idx) => elem === newValue[idx])) {
        return true;
      }
      return false;
    })) {
      return null;
    }
    return newValues;
  }
  triggerIfChanged(context, updates) {
    const newValues = !this.paths.length ? [] : this.#valuesChanged(context, this.initialized ? updates : {});
    if (!newValues) {
      return;
    }
    const previousValues = this.#previousValues;
    this.#previousValues = newValues;
    this.#changeCallbacks.forEach((callback) => callback(this.multiValues ? newValues : newValues[0], this.multiValues ? previousValues : previousValues[0]));
    if (this.#addedElementsCallback && newValues.some((val) => Array.isArray(val))) {
      let hasNewElements = false;
      const newElementsArray = newValues.map((val, index) => {
        if (Array.isArray(val)) {
          const previousSet = new Set(Array.isArray(previousValues[index]) ? previousValues[index] : []);
          const newElements = val.filter((clientId) => !previousSet.has(clientId));
          if (newElements.length) {
            hasNewElements = true;
          }
          return newElements;
        }
      });
      if (hasNewElements) {
        this.#addedElementsCallback.forEach((callback) => callback(this.multiValues ? newElementsArray : newElementsArray[0]));
      }
    }
    if (this.#deletedElementsCallback && previousValues.some((val) => Array.isArray(val))) {
      let hasDeletedElements = false;
      const deletedElementsArray = previousValues.map((prev, index) => {
        if (Array.isArray(prev)) {
          const currentSet = new Set(Array.isArray(newValues[index]) ? newValues[index] : []);
          const deletedElements = prev.filter((clientId) => !currentSet.has(clientId));
          if (deletedElements.length) {
            hasDeletedElements = true;
          }
          return deletedElements;
        }
      });
      if (hasDeletedElements) {
        this.#deletedElementsCallback.forEach((callback) => callback(this.multiValues ? deletedElementsArray : deletedElementsArray[0]));
      }
    }
    this.initialized = true;
  }
  close() {
    this.observerManagger.removeObserver(this);
  }
}

// ../../NAPL/src/observer/ObserverManager.ts
class ObserverManager {
  #observers = new Set;
  observe(paths, multi) {
    const observer = new Observer(paths, this, multi);
    this.#observers.add(observer);
    return observer;
  }
  triggerObservers(context, updates) {
    this.#observers.forEach((o) => o.triggerIfChanged(context, updates));
  }
  removeObserver(observer) {
    this.#observers.delete(observer);
  }
  close() {
    this.#observers.forEach((o) => o.close());
  }
}

// ../../NAPL/src/core/Processor.ts
class Processor {
  sendUpdate;
  #observerManager = new ObserverManager;
  constructor(sendUpdate) {
    this.sendUpdate = sendUpdate;
  }
  observe(paths) {
    const multi = Array.isArray(paths);
    const pathArray = paths === undefined ? [] : multi ? paths : [paths];
    return this.#observerManager.observe(pathArray, multi);
  }
  removeObserver(observer) {
    this.#observerManager.removeObserver(observer);
  }
  performCycle(context) {
    this.sendUpdateBlob(context);
    const updates = commitUpdates(context.root, context.properties);
    this.#observerManager.triggerObservers(context, updates);
    return updates;
  }
  sendUpdateBlob(context) {
    if (context.outgoingUpdates?.length) {
      context.outgoingUpdates.forEach((update) => {
        update.path = this.#fixPath(update.path, context);
        const previous = getLeafObject(context.root, update.path.split("/"), 0, false);
        update.value = typeof update.value === "function" ? update.value(previous) : update.value;
      });
      const confirmedUpdates = context.outgoingUpdates.filter(({ confirmed }) => confirmed).map((update) => ({ ...update }));
      this.#addIncomingUpdates(confirmedUpdates, context);
      const blobs = {};
      context.outgoingUpdates.forEach((update) => update.value = gn(update.value, blobs));
      this.sendUpdate(packageUpdates(context.outgoingUpdates, blobs));
    }
    context.outgoingUpdates.length = 0;
  }
  async receivedBlob(data, context) {
    const { payload, blobs } = data instanceof Blob ? await receiveBlob(data) : { payload: typeof data === "string" ? JSON.parse(data) : data, blobs: {} };
    const hasBlobs = blobs && Object.keys(blobs).length > 0;
    if (payload?.myClientId) {
      context.clientId = payload.myClientId;
    }
    if (payload?.updates) {
      if (hasBlobs) {
        payload.updates.forEach((update) => {
          update.value = un(update.value, blobs);
        });
      }
      this.#addIncomingUpdates(payload.updates, context);
    }
  }
  #addIncomingUpdates(updates, context) {
    context.root.updates = context.root.updates ?? [];
    context.root.updates.push(...updates);
  }
  #fixPath(path, context) {
    const split = path.split("/");
    return split.map((part) => translateValue(part, {
      self: context.clientId
    })).join("/");
  }
}
// ../../NAPL/src/cycles/data-update/data-manager.ts
function getData(root, path = "", properties) {
  const parts = path.split("/");
  return getLeafObject(root, parts, 0, false, properties);
}
function pushData(root, now, outgoingUpdates, path, value, options = {}) {
  processDataUpdate(root, now, outgoingUpdates, {
    path,
    value,
    append: true
  }, options);
}
function setData(root, now, outgoingUpdates, path, value, options = {}) {
  processDataUpdate(root, now, outgoingUpdates, {
    path,
    value,
    append: options.append,
    insert: options.insert
  }, options);
}
function processDataUpdate(root, now, outgoingUpdates, update, options = {}) {
  if (options.active ?? root.config?.activeUpdates) {
    markUpdateConfirmed(update, now);
  }
  outgoingUpdates.push(update);
}
// ../../NAPL/src/clients/ClientData.ts
class ClientData {
  syncClient;
  clientId = "";
  constructor(syncClient) {
    this.syncClient = syncClient;
  }
  #getAbsolutePath(path) {
    return path.length ? `clients/~{self}/${path}` : "clients/~{self}";
  }
  getData(path) {
    return this.syncClient.getData(this.#getAbsolutePath(path));
  }
  observe(paths) {
    return this.syncClient.observe(paths === undefined ? undefined : Array.isArray(paths) ? paths.map((p) => this.#getAbsolutePath(p)) : this.#getAbsolutePath(paths));
  }
  removeObserver(observer) {
    this.syncClient.removeObserver(observer);
  }
  setData(path, value, options) {
    return this.syncClient.setData(this.#getAbsolutePath(path), value, options);
  }
  pushData(path, value, options) {
    return this.syncClient.pushData(this.#getAbsolutePath(path), value, options);
  }
  get state() {
    return this.syncClient.state.clients?.[this.clientId] ?? {};
  }
}

// ../../NAPL/src/clients/SubData.ts
class SubData {
  path;
  syncClient;
  #parts = [];
  #observers = new Set;
  constructor(path, syncClient) {
    this.path = path;
    this.syncClient = syncClient;
    this.#parts = path.split("/").map((v) => {
      return isNaN(Number(v)) ? v : Number(v);
    });
  }
  getData(path) {
    return this.syncClient.getData(this.#getAbsolutePath(path));
  }
  get clientId() {
    return this.syncClient.clientId;
  }
  #getAbsolutePath(path) {
    return path.length ? `${this.path}/${path}` : this.path;
  }
  observe(paths) {
    const observer = this.syncClient.observe(paths === undefined ? undefined : Array.isArray(paths) ? paths.map((p) => this.#getAbsolutePath(p)) : this.#getAbsolutePath(paths));
    this.#observers.add(observer);
    return observer;
  }
  removeObserver(observer) {
    this.#observers.delete(observer);
    this.syncClient.removeObserver(observer);
  }
  setData(path, value, options) {
    return this.syncClient.setData(this.#getAbsolutePath(path), value, options);
  }
  pushData(path, value, options) {
    return this.syncClient.pushData(this.#getAbsolutePath(path), value, options);
  }
  get state() {
    return getLeafObject(this.syncClient.state, this.#parts, 0, false, {
      self: this.syncClient.clientId
    }) ?? {};
  }
  close() {
    this.#observers.forEach((o) => this.removeObserver(o));
    this.syncClient.removeChildData(this.path);
  }
}

// ../../NAPL/src/utils/execution-utils.ts
var nextFrameInProgress = new Set;
function prepareNextFrame(callback, ...params) {
  if (nextFrameInProgress.has(callback)) {
    return;
  }
  nextFrameInProgress.add(callback);
  requestAnimationFrame(() => {
    nextFrameInProgress.delete(callback);
    callback(...params);
  });
}
function executeFrame(callback, ...params) {
  nextFrameInProgress.delete(callback);
  callback(...params);
}

// ../../NAPL/src/clients/SyncClient.ts
class SyncClient {
  commProvider;
  state;
  #children = new Map;
  #comm;
  #connectionPromise;
  #selfData = new ClientData(this);
  #processor = new Processor((blob) => {
    if (blob.size > 1024 * 1024 * 10) {
      console.error(`Blob too large: ${blob.size / 1024 / 1024} MB`);
      return;
    }
    this.#comm?.send(blob);
  });
  outgoingUpdates = [];
  #closeListener = () => {};
  constructor(commProvider, initialState = {}) {
    this.commProvider = commProvider;
    this.state = initialState;
    this.#connect();
    globalThis.addEventListener("focus", () => {
      if (!this.#comm) {
        const autoReconnect = this.state.config?.autoReconnect ?? true;
        if (autoReconnect) {
          this.#connect().catch((e) => {
            console.warn("Failed to reconnect");
          });
        }
      }
    });
    this.#children.set(`clients/~{self}`, this.#selfData);
    this.processNextFrame = this.processNextFrame.bind(this);
  }
  onClose(listener) {
    this.#closeListener = listener;
    return this;
  }
  getData(path) {
    const properties = {
      self: this.clientId,
      now: this.now
    };
    return getData(this.state, path, properties);
  }
  pushData(path, value, options = {}) {
    pushData(this.state, this.now, this.outgoingUpdates, path, value, options);
    if (options.flush) {
      executeFrame(this.processNextFrame);
    } else {
      prepareNextFrame(this.processNextFrame);
    }
  }
  setData(path, value, options = {}) {
    setData(this.state, this.now, this.outgoingUpdates, path, value, options);
    if (options.flush) {
      executeFrame(this.processNextFrame);
    } else {
      prepareNextFrame(this.processNextFrame);
    }
  }
  get clientId() {
    return this.#selfData.clientId;
  }
  get self() {
    return this.#selfData;
  }
  access(path) {
    const childData = this.#children.get(path);
    if (childData) {
      return childData;
    }
    const subData = new SubData(path, this);
    this.#children.set(path, subData);
    return subData;
  }
  peerData(peerId) {
    const peerTag = [this.clientId, peerId].sort().join(":");
    return this.access(`peer/${peerTag}`);
  }
  removeChildData(path) {
    this.#children.delete(path);
  }
  observe(paths) {
    return this.#processor.observe(paths);
  }
  removeObserver(observer) {
    this.#processor.removeObserver(observer);
  }
  async#waitForConnection() {
    if (!this.#comm) {
      this.#connect();
    }
    return this.#connectionPromise;
  }
  async#connect() {
    const comm = this.#comm = this.commProvider();
    return this.#connectionPromise = new Promise((resolve, reject) => {
      comm.onError((event) => {
        console.error("SyncClient connection error", event);
        reject(event);
      });
      comm.onMessage(async (data) => {
        await this.onMessageBlob(data);
        if (this.#connectionPromise && this.clientId) {
          this.#connectionPromise = undefined;
          resolve();
        }
      });
      comm.onClose(() => {
        this.#comm = undefined;
        this.#closeListener();
        this.setData(`/clients/${this.clientId}`, undefined, {
          active: true,
          flush: true
        });
      });
    });
  }
  close() {
    this.#comm?.close();
  }
  async onMessageBlob(blob) {
    const context = {
      root: this.state,
      clientId: this.clientId,
      properties: {
        self: this.clientId,
        now: this.now
      },
      outgoingUpdates: this.outgoingUpdates
    };
    await this.#processor.receivedBlob(blob, context);
    if (context.clientId) {
      this.#selfData.clientId = context.clientId;
    }
    executeFrame(this.processNextFrame);
  }
  get now() {
    return Date.now();
  }
  async processNextFrame() {
    if (this.outgoingUpdates.length) {
      await this.#waitForConnection();
    }
    const context = {
      root: this.state,
      clientId: this.clientId,
      properties: {
        self: this.clientId,
        now: this.now
      },
      outgoingUpdates: this.outgoingUpdates
    };
    this.#processor.performCycle(context);
    if (context.clientId) {
      this.#selfData.clientId = context.clientId;
    }
  }
}
// ../../NAPL/src/clients/ui/users.ts
var EMOJIS = [
  "\uD83D\uDC35",
  "\uD83D\uDC12",
  "\uD83E\uDD8D",
  "\uD83E\uDDA7",
  "\uD83D\uDC36",
  "\uD83D\uDC15",
  "\uD83E\uDDAE",
  "\uD83D\uDC15‍\uD83E\uDDBA",
  "\uD83D\uDC29",
  "\uD83D\uDC3A",
  "\uD83E\uDD8A",
  "\uD83E\uDD9D",
  "\uD83D\uDC31",
  "\uD83D\uDC08",
  "\uD83D\uDC08‍⬛",
  "\uD83E\uDD81",
  "\uD83D\uDC2F",
  "\uD83D\uDC05",
  "\uD83D\uDC06",
  "\uD83D\uDC34",
  "\uD83E\uDECE",
  "\uD83E\uDECF",
  "\uD83D\uDC0E",
  "\uD83E\uDD84",
  "\uD83E\uDD93",
  "\uD83E\uDD8C",
  "\uD83E\uDDAC",
  "\uD83D\uDC2E",
  "\uD83D\uDC02",
  "\uD83D\uDC03",
  "\uD83D\uDC04",
  "\uD83D\uDC37",
  "\uD83D\uDC16",
  "\uD83D\uDC17",
  "\uD83D\uDC3D",
  "\uD83D\uDC0F",
  "\uD83D\uDC11",
  "\uD83D\uDC10",
  "\uD83D\uDC2A",
  "\uD83D\uDC2B",
  "\uD83E\uDD99",
  "\uD83E\uDD92",
  "\uD83D\uDC18",
  "\uD83E\uDDA3",
  "\uD83E\uDD8F",
  "\uD83E\uDD9B",
  "\uD83D\uDC2D",
  "\uD83D\uDC01",
  "\uD83D\uDC00",
  "\uD83D\uDC39",
  "\uD83D\uDC30",
  "\uD83D\uDC07",
  "\uD83D\uDC3F️",
  "\uD83E\uDDAB",
  "\uD83E\uDD94",
  "\uD83E\uDD87",
  "\uD83D\uDC3B",
  "\uD83D\uDC3B‍❄️",
  "\uD83D\uDC28",
  "\uD83D\uDC3C",
  "\uD83E\uDDA5",
  "\uD83E\uDDA6",
  "\uD83E\uDDA8",
  "\uD83E\uDD98",
  "\uD83E\uDDA1",
  "\uD83D\uDC3E",
  "\uD83E\uDD83",
  "\uD83D\uDC14",
  "\uD83D\uDC13",
  "\uD83D\uDC23",
  "\uD83D\uDC24",
  "\uD83D\uDC25",
  "\uD83D\uDC26",
  "\uD83D\uDC27",
  "\uD83D\uDD4A️",
  "\uD83E\uDD85",
  "\uD83E\uDD86",
  "\uD83E\uDDA2",
  "\uD83E\uDD89",
  "\uD83E\uDDA4",
  "\uD83E\uDEB6",
  "\uD83E\uDDA9",
  "\uD83E\uDD9A",
  "\uD83E\uDD9C",
  "\uD83E\uDEBD",
  "\uD83D\uDC26‍⬛",
  "\uD83E\uDEBF",
  "\uD83D\uDC26‍\uD83D\uDD25",
  "\uD83E\uDEB9",
  "\uD83E\uDEBA",
  "\uD83D\uDC38",
  "\uD83D\uDC0A",
  "\uD83D\uDC22",
  "\uD83E\uDD8E",
  "\uD83D\uDC0D",
  "\uD83D\uDC32",
  "\uD83D\uDC09",
  "\uD83E\uDD95",
  "\uD83E\uDD96",
  "\uD83D\uDC33",
  "\uD83D\uDC0B",
  "\uD83D\uDC2C",
  "\uD83E\uDDAD",
  "\uD83D\uDC1F",
  "\uD83D\uDC20",
  "\uD83D\uDC21",
  "\uD83E\uDD88",
  "\uD83D\uDC19",
  "\uD83D\uDC1A",
  "\uD83E\uDEB8",
  "\uD83E\uDEBC",
  "\uD83E\uDD80",
  "\uD83E\uDD9E",
  "\uD83E\uDD90",
  "\uD83E\uDD91",
  "\uD83E\uDDAA",
  "\uD83D\uDC0C",
  "\uD83E\uDD8B",
  "\uD83D\uDC1B",
  "\uD83D\uDC1C",
  "\uD83D\uDC1D",
  "\uD83E\uDEB2",
  "\uD83D\uDC1E",
  "\uD83E\uDD97",
  "\uD83E\uDEB3",
  "\uD83D\uDD77️",
  "\uD83D\uDD78️",
  "\uD83E\uDD82",
  "\uD83E\uDD9F",
  "\uD83E\uDEB0",
  "\uD83E\uDEB1",
  "\uD83E\uDDA0",
  "\uD83D\uDC90",
  "\uD83C\uDF38",
  "\uD83D\uDCAE",
  "\uD83E\uDEB7",
  "\uD83C\uDFF5️",
  "\uD83C\uDF39",
  "\uD83E\uDD40",
  "\uD83C\uDF3A",
  "\uD83C\uDF3B",
  "\uD83C\uDF3C",
  "\uD83C\uDF37",
  "\uD83E\uDEBB",
  "\uD83C\uDF31",
  "\uD83E\uDEB4",
  "\uD83C\uDF32",
  "\uD83C\uDF33",
  "\uD83C\uDF34",
  "\uD83C\uDF35",
  "\uD83C\uDF3E",
  "\uD83C\uDF3F",
  "☘️",
  "\uD83C\uDF40",
  "\uD83C\uDF41",
  "\uD83C\uDF42",
  "\uD83C\uDF43",
  "\uD83C\uDF44",
  "\uD83E\uDEA8",
  "\uD83E\uDEB5"
];
function handleUsersChanged(syncClient) {
  const userAddedSet = new Set;
  const userRemovedSet = new Set;
  syncClient.observe("clients/~{keys}").onElementsAdded((clientIds) => {
    clientIds?.forEach((clientId) => {
      const isSelf = clientId === syncClient.clientId;
      const observers = new Set;
      userAddedSet.forEach((userAdded) => userAdded(clientId, isSelf, observers));
      observers.add(syncClient.observe(`clients/${clientId}`).onChange((client) => {
        if (client === undefined) {
          observers.forEach((observer) => observer.close());
        }
      }));
    });
  }).onElementsDeleted((clientIds) => {
    clientIds.forEach((clientId) => userRemovedSet.forEach((userRemoved) => userRemoved(clientId)));
  });
  const returnValue = {
    onUserAdded: (callback) => {
      if (callback) {
        userAddedSet.add(callback);
      }
      return returnValue;
    },
    onUserRemoved: (callback) => {
      if (callback) {
        userRemovedSet.add(callback);
      }
      return returnValue;
    }
  };
  return returnValue;
}
function displayUsers(syncClient, userDiv) {
  userDiv = userDiv ?? document.body.appendChild(document.createElement("div"));
  userDiv.classList.add("syncousers");
  handleUsersChanged(syncClient).onUserAdded?.((clientId, isSelf, observers) => {
    console.log("added", clientId);
    getOrCreateClientBox(syncClient, userDiv, observers, clientId, isSelf);
  }).onUserRemoved?.((clientId) => {
    console.log("removed", clientId);
    const client = document.querySelector(`#div-${clientId}`);
    if (client) {
      client.style.transition = "opacity 0.3s";
      client.style.opacity = "0";
      setTimeout(() => {
        client.remove();
      }, 300);
    }
  });
  introduceName(syncClient);
}
function introduceName(syncClient, name, emoji) {
  syncClient.self.setData("name", name ?? randomName());
  syncClient.self.setData("emoji", emoji ?? randomEmoji());
}
var name;
function randomName() {
  return name ?? (name = "user-" + Math.random().toString(36).substring(8));
}
var emoji;
function randomEmoji(forceRandom) {
  return (forceRandom ? null : emoji) ?? (emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
}
function getOrCreateClientBox(syncClient, container, observers, clientId, isSelf) {
  const box = document.querySelector(`#client-${clientId}`);
  if (box) {
    return box;
  }
  const clientBox = document.createElement("div");
  clientBox.id = `client-${clientId}`;
  clientBox.classList.add("client-box");
  clientBox.style.backgroundColor = isSelf ? "yellow" : "";
  clientBox.style.fontWeight = isSelf ? "bold" : "normal";
  clientBox.style.display = "flex";
  clientBox.style.flexDirection = "row";
  const emojiDiv = clientBox.appendChild(document.createElement("span"));
  emojiDiv.style.marginRight = "5px";
  if (isSelf) {
    emojiDiv.style.cursor = "pointer";
    emojiDiv.addEventListener("click", () => {
      syncClient.setData(`clients/~{self}/emoji`, randomEmoji(true));
    });
  }
  const nameDiv = clientBox.appendChild(document.createElement("div"));
  nameDiv.id = `name-${clientId}`;
  nameDiv.style.width = "calc(100% - 10px)";
  observers.add(syncClient.observe([
    `clients/${clientId}/emoji`,
    `clients/${clientId}/name`
  ]).onChange(([emoji2, name2]) => {
    emojiDiv.textContent = emoji2;
    nameDiv.textContent = name2;
  }));
  if (isSelf) {
    container.prepend(clientBox);
  } else {
    container.appendChild(clientBox);
  }
  return clientBox;
}
// ../node_modules/@dobuki/data-blob/dist/index.js
var Yn2 = Object.create;
var { defineProperty: Rt2, getPrototypeOf: En2, getOwnPropertyNames: In2 } = Object;
var Nn2 = Object.prototype.hasOwnProperty;
var xn2 = (n, t, i) => {
  i = n != null ? Yn2(En2(n)) : {};
  let r = t || !n || !n.__esModule ? Rt2(i, "default", { value: n, enumerable: true }) : i;
  for (let m of In2(n))
    if (!Nn2.call(r, m))
      Rt2(r, m, { get: () => n[m], enumerable: true });
  return r;
};
var b2 = (n, t) => () => (t || n((t = { exports: {} }).exports, t), t.exports);
var jn2 = b2((n, t) => {
  var i = function(x) {
    throw { name: "SyntaxError", message: x, at: g, text: N };
  }, r = function(x) {
    if (x && x !== h)
      i("Expected '" + x + "' instead of '" + h + "'");
    return h = N.charAt(g), g += 1, h;
  }, m = function() {
    var x, v = "";
    if (h === "-")
      v = "-", r("-");
    while (h >= "0" && h <= "9")
      v += h, r();
    if (h === ".") {
      v += ".";
      while (r() && h >= "0" && h <= "9")
        v += h;
    }
    if (h === "e" || h === "E") {
      if (v += h, r(), h === "-" || h === "+")
        v += h, r();
      while (h >= "0" && h <= "9")
        v += h, r();
    }
    if (x = Number(v), !isFinite(x))
      i("Bad number");
    return x;
  }, c = function() {
    var x, v, j = "", S;
    if (h === '"')
      while (r())
        if (h === '"')
          return r(), j;
        else if (h === "\\")
          if (r(), h === "u") {
            S = 0;
            for (v = 0;v < 4; v += 1) {
              if (x = parseInt(r(), 16), !isFinite(x))
                break;
              S = S * 16 + x;
            }
            j += String.fromCharCode(S);
          } else if (typeof Y[h] === "string")
            j += Y[h];
          else
            break;
        else
          j += h;
    i("Bad string");
  }, u = function() {
    while (h && h <= " ")
      r();
  }, I = function() {
    switch (h) {
      case "t":
        return r("t"), r("r"), r("u"), r("e"), true;
      case "f":
        return r("f"), r("a"), r("l"), r("s"), r("e"), false;
      case "n":
        return r("n"), r("u"), r("l"), r("l"), null;
      default:
        i("Unexpected '" + h + "'");
    }
  }, s = function() {
    var x = [];
    if (h === "[") {
      if (r("["), u(), h === "]")
        return r("]"), x;
      while (h) {
        if (x.push(E()), u(), h === "]")
          return r("]"), x;
        r(","), u();
      }
    }
    i("Bad array");
  }, e = function() {
    var x, v = {};
    if (h === "{") {
      if (r("{"), u(), h === "}")
        return r("}"), v;
      while (h) {
        if (x = c(), u(), r(":"), Object.prototype.hasOwnProperty.call(v, x))
          i('Duplicate key "' + x + '"');
        if (v[x] = E(), u(), h === "}")
          return r("}"), v;
        r(","), u();
      }
    }
    i("Bad object");
  }, E = function() {
    switch (u(), h) {
      case "{":
        return e();
      case "[":
        return s();
      case '"':
        return c();
      case "-":
        return m();
      default:
        return h >= "0" && h <= "9" ? m() : I();
    }
  }, g, h, Y = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: `
`, r: "\r", t: "\t" }, N;
  t.exports = function(x, v) {
    var j;
    if (N = x, g = 0, h = " ", j = E(), u(), h)
      i("Syntax error");
    return typeof v === "function" ? function S(A, T) {
      var d, R, P = A[T];
      if (P && typeof P === "object") {
        for (d in E)
          if (Object.prototype.hasOwnProperty.call(P, d))
            if (R = S(P, d), typeof R === "undefined")
              delete P[d];
            else
              P[d] = R;
      }
      return v.call(A, T, P);
    }({ "": j }, "") : j;
  };
});
var vn2 = b2((n, t) => {
  var i = function(e) {
    return m.lastIndex = 0, m.test(e) ? '"' + e.replace(m, function(E) {
      var g = I[E];
      return typeof g === "string" ? g : "\\u" + ("0000" + E.charCodeAt(0).toString(16)).slice(-4);
    }) + '"' : '"' + e + '"';
  }, r = function(e, E) {
    var g, h, Y, N, x = c, v, j = E[e];
    if (j && typeof j === "object" && typeof j.toJSON === "function")
      j = j.toJSON(e);
    if (typeof s === "function")
      j = s.call(E, e, j);
    switch (typeof j) {
      case "string":
        return i(j);
      case "number":
        return isFinite(j) ? String(j) : "null";
      case "boolean":
      case "null":
        return String(j);
      case "object":
        if (!j)
          return "null";
        if (c += u, v = [], Object.prototype.toString.apply(j) === "[object Array]") {
          N = j.length;
          for (g = 0;g < N; g += 1)
            v[g] = r(g, j) || "null";
          return Y = v.length === 0 ? "[]" : c ? `[
` + c + v.join(`,
` + c) + `
` + x + "]" : "[" + v.join(",") + "]", c = x, Y;
        }
        if (s && typeof s === "object") {
          N = s.length;
          for (g = 0;g < N; g += 1)
            if (h = s[g], typeof h === "string") {
              if (Y = r(h, j), Y)
                v.push(i(h) + (c ? ": " : ":") + Y);
            }
        } else
          for (h in j)
            if (Object.prototype.hasOwnProperty.call(j, h)) {
              if (Y = r(h, j), Y)
                v.push(i(h) + (c ? ": " : ":") + Y);
            }
        return Y = v.length === 0 ? "{}" : c ? `{
` + c + v.join(`,
` + c) + `
` + x + "}" : "{" + v.join(",") + "}", c = x, Y;
      default:
    }
  }, m = /[\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, c, u, I = { "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r", '"': "\\\"", "\\": "\\\\" }, s;
  t.exports = function(e, E, g) {
    var h;
    if (c = "", u = "", typeof g === "number")
      for (h = 0;h < g; h += 1)
        u += " ";
    else if (typeof g === "string")
      u = g;
    if (s = E, E && typeof E !== "function" && (typeof E !== "object" || typeof E.length !== "number"))
      throw new Error("JSON.stringify");
    return r("", { "": e });
  };
});
var $n2 = b2((n) => {
  n.parse = jn2(), n.stringify = vn2();
});
var Pn2 = b2((n, t) => {
  var i = {}.toString;
  t.exports = Array.isArray || function(r) {
    return i.call(r) == "[object Array]";
  };
});
var Vt2 = b2((n, t) => {
  var i = Object.prototype.toString;
  t.exports = function r(m) {
    var c = i.call(m), u = c === "[object Arguments]";
    if (!u)
      u = c !== "[object Array]" && m !== null && typeof m === "object" && typeof m.length === "number" && m.length >= 0 && i.call(m.callee) === "[object Function]";
    return u;
  };
});
var Sn2 = b2((n, t) => {
  var i;
  if (!Object.keys)
    r = Object.prototype.hasOwnProperty, m = Object.prototype.toString, c = Vt2(), u = Object.prototype.propertyIsEnumerable, I = !u.call({ toString: null }, "toString"), s = u.call(function() {}, "prototype"), e = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"], E = function(N) {
      var x = N.constructor;
      return x && x.prototype === N;
    }, g = { $applicationCache: true, $console: true, $external: true, $frame: true, $frameElement: true, $frames: true, $innerHeight: true, $innerWidth: true, $onmozfullscreenchange: true, $onmozfullscreenerror: true, $outerHeight: true, $outerWidth: true, $pageXOffset: true, $pageYOffset: true, $parent: true, $scrollLeft: true, $scrollTop: true, $scrollX: true, $scrollY: true, $self: true, $webkitIndexedDB: true, $webkitStorageInfo: true, $window: true }, h = function() {
      if (typeof window === "undefined")
        return false;
      for (var N in window)
        try {
          if (!g["$" + N] && r.call(window, N) && window[N] !== null && typeof window[N] === "object")
            try {
              E(window[N]);
            } catch (x) {
              return true;
            }
        } catch (x) {
          return true;
        }
      return false;
    }(), Y = function(N) {
      if (typeof window === "undefined" || !h)
        return E(N);
      try {
        return E(N);
      } catch (x) {
        return false;
      }
    }, i = function N(x) {
      var v = x !== null && typeof x === "object", j = m.call(x) === "[object Function]", S = c(x), A = v && m.call(x) === "[object String]", T = [];
      if (!v && !j && !S)
        throw new TypeError("Object.keys called on a non-object");
      var d = s && j;
      if (A && x.length > 0 && !r.call(x, 0))
        for (var R = 0;R < x.length; ++R)
          T.push(String(R));
      if (S && x.length > 0)
        for (var P = 0;P < x.length; ++P)
          T.push(String(P));
      else
        for (var H in x)
          if (!(d && H === "prototype") && r.call(x, H))
            T.push(String(H));
      if (I) {
        var U = Y(x);
        for (var a = 0;a < e.length; ++a)
          if (!(U && e[a] === "constructor") && r.call(x, e[a]))
            T.push(e[a]);
      }
      return T;
    };
  var r, m, c, u, I, s, e, E, g, h, Y;
  t.exports = i;
});
var Tn2 = b2((n, t) => {
  var i = Array.prototype.slice, r = Vt2(), m = Object.keys, c = m ? function I(s) {
    return m(s);
  } : Sn2(), u = Object.keys;
  c.shim = function I() {
    if (Object.keys) {
      var s = function() {
        var e = Object.keys(arguments);
        return e && e.length === arguments.length;
      }(1, 2);
      if (!s)
        Object.keys = function e(E) {
          if (r(E))
            return u(i.call(E));
          return u(E);
        };
    } else
      Object.keys = c;
    return Object.keys || c;
  }, t.exports = c;
});
var An2 = b2((n, t) => {
  var i = "Function.prototype.bind called on incompatible ", r = Object.prototype.toString, m = Math.max, c = "[object Function]", u = function e(E, g) {
    var h = [];
    for (var Y = 0;Y < E.length; Y += 1)
      h[Y] = E[Y];
    for (var N = 0;N < g.length; N += 1)
      h[N + E.length] = g[N];
    return h;
  }, I = function e(E, g) {
    var h = [];
    for (var Y = g || 0, N = 0;Y < E.length; Y += 1, N += 1)
      h[N] = E[Y];
    return h;
  }, s = function(e, E) {
    var g = "";
    for (var h = 0;h < e.length; h += 1)
      if (g += e[h], h + 1 < e.length)
        g += E;
    return g;
  };
  t.exports = function e(E) {
    var g = this;
    if (typeof g !== "function" || r.apply(g) !== c)
      throw new TypeError(i + g);
    var h = I(arguments, 1), Y, N = function() {
      if (this instanceof Y) {
        var A = g.apply(this, u(h, arguments));
        if (Object(A) === A)
          return A;
        return this;
      }
      return g.apply(E, u(h, arguments));
    }, x = m(0, g.length - h.length), v = [];
    for (var j = 0;j < x; j++)
      v[j] = "$" + j;
    if (Y = Function("binder", "return function (" + s(v, ",") + "){ return binder.apply(this,arguments); }")(N), g.prototype) {
      var S = function A() {};
      S.prototype = g.prototype, Y.prototype = new S, S.prototype = null;
    }
    return Y;
  };
});
var vt2 = b2((n, t) => {
  var i = An2();
  t.exports = Function.prototype.bind || i;
});
var kn2 = b2((n, t) => {
  t.exports = Error;
});
var bn2 = b2((n, t) => {
  t.exports = EvalError;
});
var dn2 = b2((n, t) => {
  t.exports = RangeError;
});
var Cn2 = b2((n, t) => {
  t.exports = ReferenceError;
});
var Ut2 = b2((n, t) => {
  t.exports = SyntaxError;
});
var $t2 = b2((n, t) => {
  t.exports = TypeError;
});
var On2 = b2((n, t) => {
  t.exports = URIError;
});
var Rn2 = b2((n, t) => {
  t.exports = function i() {
    if (typeof Symbol !== "function" || typeof Object.getOwnPropertySymbols !== "function")
      return false;
    if (typeof Symbol.iterator === "symbol")
      return true;
    var r = {}, m = Symbol("test"), c = Object(m);
    if (typeof m === "string")
      return false;
    if (Object.prototype.toString.call(m) !== "[object Symbol]")
      return false;
    if (Object.prototype.toString.call(c) !== "[object Symbol]")
      return false;
    var u = 42;
    r[m] = u;
    for (m in r)
      return false;
    if (typeof Object.keys === "function" && Object.keys(r).length !== 0)
      return false;
    if (typeof Object.getOwnPropertyNames === "function" && Object.getOwnPropertyNames(r).length !== 0)
      return false;
    var I = Object.getOwnPropertySymbols(r);
    if (I.length !== 1 || I[0] !== m)
      return false;
    if (!Object.prototype.propertyIsEnumerable.call(r, m))
      return false;
    if (typeof Object.getOwnPropertyDescriptor === "function") {
      var s = Object.getOwnPropertyDescriptor(r, m);
      if (s.value !== u || s.enumerable !== true)
        return false;
    }
    return true;
  };
});
var Gt2 = b2((n, t) => {
  var i = typeof Symbol !== "undefined" && Symbol, r = Rn2();
  t.exports = function m() {
    if (typeof i !== "function")
      return false;
    if (typeof Symbol !== "function")
      return false;
    if (typeof i("foo") !== "symbol")
      return false;
    if (typeof Symbol("bar") !== "symbol")
      return false;
    return r();
  };
});
var Zt2 = b2((n, t) => {
  var i = { foo: {} }, r = Object;
  t.exports = function m() {
    return { __proto__: i }.foo === i.foo && !({ __proto__: null } instanceof r);
  };
});
var at2 = b2((n, t) => {
  var i = Function.prototype.call, r = Object.prototype.hasOwnProperty, m = vt2();
  t.exports = m.call(i, r);
});
var Pt2 = b2((n, t) => {
  var i, r = kn2(), m = bn2(), c = dn2(), u = Cn2(), I = Ut2(), s = $t2(), e = On2(), E = Function, g = function(D) {
    try {
      return E('"use strict"; return (' + D + ").constructor;")();
    } catch (C) {}
  }, h = Object.getOwnPropertyDescriptor;
  if (h)
    try {
      h({}, "");
    } catch (D) {
      h = null;
    }
  var Y = function() {
    throw new s;
  }, N = h ? function() {
    try {
      return arguments.callee, Y;
    } catch (D) {
      try {
        return h(arguments, "callee").get;
      } catch (C) {
        return Y;
      }
    }
  }() : Y, x = Gt2()(), v = Zt2()(), j = Object.getPrototypeOf || (v ? function(D) {
    return D.__proto__;
  } : null), S = {}, A = typeof Uint8Array === "undefined" || !j ? i : j(Uint8Array), T = { __proto__: null, "%AggregateError%": typeof AggregateError === "undefined" ? i : AggregateError, "%Array%": Array, "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? i : ArrayBuffer, "%ArrayIteratorPrototype%": x && j ? j([][Symbol.iterator]()) : i, "%AsyncFromSyncIteratorPrototype%": i, "%AsyncFunction%": S, "%AsyncGenerator%": S, "%AsyncGeneratorFunction%": S, "%AsyncIteratorPrototype%": S, "%Atomics%": typeof Atomics === "undefined" ? i : Atomics, "%BigInt%": typeof BigInt === "undefined" ? i : BigInt, "%BigInt64Array%": typeof BigInt64Array === "undefined" ? i : BigInt64Array, "%BigUint64Array%": typeof BigUint64Array === "undefined" ? i : BigUint64Array, "%Boolean%": Boolean, "%DataView%": typeof DataView === "undefined" ? i : DataView, "%Date%": Date, "%decodeURI%": decodeURI, "%decodeURIComponent%": decodeURIComponent, "%encodeURI%": encodeURI, "%encodeURIComponent%": encodeURIComponent, "%Error%": r, "%eval%": eval, "%EvalError%": m, "%Float32Array%": typeof Float32Array === "undefined" ? i : Float32Array, "%Float64Array%": typeof Float64Array === "undefined" ? i : Float64Array, "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? i : FinalizationRegistry, "%Function%": E, "%GeneratorFunction%": S, "%Int8Array%": typeof Int8Array === "undefined" ? i : Int8Array, "%Int16Array%": typeof Int16Array === "undefined" ? i : Int16Array, "%Int32Array%": typeof Int32Array === "undefined" ? i : Int32Array, "%isFinite%": isFinite, "%isNaN%": isNaN, "%IteratorPrototype%": x && j ? j(j([][Symbol.iterator]())) : i, "%JSON%": typeof JSON === "object" ? JSON : i, "%Map%": typeof Map === "undefined" ? i : Map, "%MapIteratorPrototype%": typeof Map === "undefined" || !x || !j ? i : j(new Map()[Symbol.iterator]()), "%Math%": Math, "%Number%": Number, "%Object%": Object, "%parseFloat%": parseFloat, "%parseInt%": parseInt, "%Promise%": typeof Promise === "undefined" ? i : Promise, "%Proxy%": typeof Proxy === "undefined" ? i : Proxy, "%RangeError%": c, "%ReferenceError%": u, "%Reflect%": typeof Reflect === "undefined" ? i : Reflect, "%RegExp%": RegExp, "%Set%": typeof Set === "undefined" ? i : Set, "%SetIteratorPrototype%": typeof Set === "undefined" || !x || !j ? i : j(new Set()[Symbol.iterator]()), "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? i : SharedArrayBuffer, "%String%": String, "%StringIteratorPrototype%": x && j ? j(""[Symbol.iterator]()) : i, "%Symbol%": x ? Symbol : i, "%SyntaxError%": I, "%ThrowTypeError%": N, "%TypedArray%": A, "%TypeError%": s, "%Uint8Array%": typeof Uint8Array === "undefined" ? i : Uint8Array, "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? i : Uint8ClampedArray, "%Uint16Array%": typeof Uint16Array === "undefined" ? i : Uint16Array, "%Uint32Array%": typeof Uint32Array === "undefined" ? i : Uint32Array, "%URIError%": e, "%WeakMap%": typeof WeakMap === "undefined" ? i : WeakMap, "%WeakRef%": typeof WeakRef === "undefined" ? i : WeakRef, "%WeakSet%": typeof WeakSet === "undefined" ? i : WeakSet };
  if (j)
    try {
      null.error;
    } catch (D) {
      d = j(j(D)), T["%Error.prototype%"] = d;
    }
  var d, R = function D(C) {
    var k;
    if (C === "%AsyncFunction%")
      k = g("async function () {}");
    else if (C === "%GeneratorFunction%")
      k = g("function* () {}");
    else if (C === "%AsyncGeneratorFunction%")
      k = g("async function* () {}");
    else if (C === "%AsyncGenerator%") {
      var p = D("%AsyncGeneratorFunction%");
      if (p)
        k = p.prototype;
    } else if (C === "%AsyncIteratorPrototype%") {
      var f = D("%AsyncGenerator%");
      if (f && j)
        k = j(f.prototype);
    }
    return T[C] = k, k;
  }, P = { __proto__: null, "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"], "%ArrayPrototype%": ["Array", "prototype"], "%ArrayProto_entries%": ["Array", "prototype", "entries"], "%ArrayProto_forEach%": ["Array", "prototype", "forEach"], "%ArrayProto_keys%": ["Array", "prototype", "keys"], "%ArrayProto_values%": ["Array", "prototype", "values"], "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"], "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"], "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"], "%BooleanPrototype%": ["Boolean", "prototype"], "%DataViewPrototype%": ["DataView", "prototype"], "%DatePrototype%": ["Date", "prototype"], "%ErrorPrototype%": ["Error", "prototype"], "%EvalErrorPrototype%": ["EvalError", "prototype"], "%Float32ArrayPrototype%": ["Float32Array", "prototype"], "%Float64ArrayPrototype%": ["Float64Array", "prototype"], "%FunctionPrototype%": ["Function", "prototype"], "%Generator%": ["GeneratorFunction", "prototype"], "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"], "%Int8ArrayPrototype%": ["Int8Array", "prototype"], "%Int16ArrayPrototype%": ["Int16Array", "prototype"], "%Int32ArrayPrototype%": ["Int32Array", "prototype"], "%JSONParse%": ["JSON", "parse"], "%JSONStringify%": ["JSON", "stringify"], "%MapPrototype%": ["Map", "prototype"], "%NumberPrototype%": ["Number", "prototype"], "%ObjectPrototype%": ["Object", "prototype"], "%ObjProto_toString%": ["Object", "prototype", "toString"], "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"], "%PromisePrototype%": ["Promise", "prototype"], "%PromiseProto_then%": ["Promise", "prototype", "then"], "%Promise_all%": ["Promise", "all"], "%Promise_reject%": ["Promise", "reject"], "%Promise_resolve%": ["Promise", "resolve"], "%RangeErrorPrototype%": ["RangeError", "prototype"], "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"], "%RegExpPrototype%": ["RegExp", "prototype"], "%SetPrototype%": ["Set", "prototype"], "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"], "%StringPrototype%": ["String", "prototype"], "%SymbolPrototype%": ["Symbol", "prototype"], "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"], "%TypedArrayPrototype%": ["TypedArray", "prototype"], "%TypeErrorPrototype%": ["TypeError", "prototype"], "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"], "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"], "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"], "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"], "%URIErrorPrototype%": ["URIError", "prototype"], "%WeakMapPrototype%": ["WeakMap", "prototype"], "%WeakSetPrototype%": ["WeakSet", "prototype"] }, H = vt2(), U = at2(), a = H.call(Function.call, Array.prototype.concat), G = H.call(Function.apply, Array.prototype.splice), rt = H.call(Function.call, String.prototype.replace), X = H.call(Function.call, String.prototype.slice), L = H.call(Function.call, RegExp.prototype.exec), O = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, M = /\\(\\)?/g, W = function D(C) {
    var k = X(C, 0, 1), p = X(C, -1);
    if (k === "%" && p !== "%")
      throw new I("invalid intrinsic syntax, expected closing `%`");
    else if (p === "%" && k !== "%")
      throw new I("invalid intrinsic syntax, expected opening `%`");
    var f = [];
    return rt(C, O, function(V, Z, o, z) {
      f[f.length] = o ? rt(z, M, "$1") : Z || V;
    }), f;
  }, l = function D(C, k) {
    var p = C, f;
    if (U(P, p))
      f = P[p], p = "%" + f[0] + "%";
    if (U(T, p)) {
      var V = T[p];
      if (V === S)
        V = R(p);
      if (typeof V === "undefined" && !k)
        throw new s("intrinsic " + C + " exists, but is not available. Please file an issue!");
      return { alias: f, name: p, value: V };
    }
    throw new I("intrinsic " + C + " does not exist!");
  };
  t.exports = function D(C, k) {
    if (typeof C !== "string" || C.length === 0)
      throw new s("intrinsic name must be a non-empty string");
    if (arguments.length > 1 && typeof k !== "boolean")
      throw new s('"allowMissing" argument must be a boolean');
    if (L(/^%?[^%]*%?$/, C) === null)
      throw new I("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    var p = W(C), f = p.length > 0 ? p[0] : "", V = l("%" + f + "%", k), Z = V.name, o = V.value, z = false, nt = V.alias;
    if (nt)
      f = nt[0], G(p, a([0, 1], nt));
    for (var _ = 1, ct = true;_ < p.length; _ += 1) {
      var J = p[_], Yt = X(J, 0, 1), Et = X(J, -1);
      if ((Yt === '"' || Yt === "'" || Yt === "`" || (Et === '"' || Et === "'" || Et === "`")) && Yt !== Et)
        throw new I("property names with quotes must have matching quotes");
      if (J === "constructor" || !ct)
        z = true;
      if (f += "." + J, Z = "%" + f + "%", U(T, Z))
        o = T[Z];
      else if (o != null) {
        if (!(J in o)) {
          if (!k)
            throw new s("base intrinsic for " + C + " exists, but the property is not available.");
          return;
        }
        if (h && _ + 1 >= p.length) {
          var It = h(o, J);
          if (ct = !!It, ct && "get" in It && !("originalValue" in It.get))
            o = It.get;
          else
            o = o[J];
        } else
          ct = U(o, J), o = o[J];
        if (ct && !z)
          T[Z] = o;
      }
    }
    return o;
  };
});
var At2 = b2((n, t) => {
  var i = Pt2(), r = i("%Object.defineProperty%", true) || false;
  if (r)
    try {
      r({}, "a", { value: 1 });
    } catch (m) {
      r = false;
    }
  t.exports = r;
});
var pn2 = b2((n, t) => {
  var i, r = SyntaxError, m = Function, c = TypeError, u = function(L) {
    try {
      return m('"use strict"; return (' + L + ").constructor;")();
    } catch (O) {}
  }, I = Object.getOwnPropertyDescriptor;
  if (I)
    try {
      I({}, "");
    } catch (L) {
      I = null;
    }
  var s = function() {
    throw new c;
  }, e = I ? function() {
    try {
      return arguments.callee, s;
    } catch (L) {
      try {
        return I(arguments, "callee").get;
      } catch (O) {
        return s;
      }
    }
  }() : s, E = Gt2()(), g = Zt2()(), h = Object.getPrototypeOf || (g ? function(L) {
    return L.__proto__;
  } : null), Y = {}, N = typeof Uint8Array === "undefined" || !h ? i : h(Uint8Array), x = { "%AggregateError%": typeof AggregateError === "undefined" ? i : AggregateError, "%Array%": Array, "%ArrayBuffer%": typeof ArrayBuffer === "undefined" ? i : ArrayBuffer, "%ArrayIteratorPrototype%": E && h ? h([][Symbol.iterator]()) : i, "%AsyncFromSyncIteratorPrototype%": i, "%AsyncFunction%": Y, "%AsyncGenerator%": Y, "%AsyncGeneratorFunction%": Y, "%AsyncIteratorPrototype%": Y, "%Atomics%": typeof Atomics === "undefined" ? i : Atomics, "%BigInt%": typeof BigInt === "undefined" ? i : BigInt, "%BigInt64Array%": typeof BigInt64Array === "undefined" ? i : BigInt64Array, "%BigUint64Array%": typeof BigUint64Array === "undefined" ? i : BigUint64Array, "%Boolean%": Boolean, "%DataView%": typeof DataView === "undefined" ? i : DataView, "%Date%": Date, "%decodeURI%": decodeURI, "%decodeURIComponent%": decodeURIComponent, "%encodeURI%": encodeURI, "%encodeURIComponent%": encodeURIComponent, "%Error%": Error, "%eval%": eval, "%EvalError%": EvalError, "%Float32Array%": typeof Float32Array === "undefined" ? i : Float32Array, "%Float64Array%": typeof Float64Array === "undefined" ? i : Float64Array, "%FinalizationRegistry%": typeof FinalizationRegistry === "undefined" ? i : FinalizationRegistry, "%Function%": m, "%GeneratorFunction%": Y, "%Int8Array%": typeof Int8Array === "undefined" ? i : Int8Array, "%Int16Array%": typeof Int16Array === "undefined" ? i : Int16Array, "%Int32Array%": typeof Int32Array === "undefined" ? i : Int32Array, "%isFinite%": isFinite, "%isNaN%": isNaN, "%IteratorPrototype%": E && h ? h(h([][Symbol.iterator]())) : i, "%JSON%": typeof JSON === "object" ? JSON : i, "%Map%": typeof Map === "undefined" ? i : Map, "%MapIteratorPrototype%": typeof Map === "undefined" || !E || !h ? i : h(new Map()[Symbol.iterator]()), "%Math%": Math, "%Number%": Number, "%Object%": Object, "%parseFloat%": parseFloat, "%parseInt%": parseInt, "%Promise%": typeof Promise === "undefined" ? i : Promise, "%Proxy%": typeof Proxy === "undefined" ? i : Proxy, "%RangeError%": RangeError, "%ReferenceError%": ReferenceError, "%Reflect%": typeof Reflect === "undefined" ? i : Reflect, "%RegExp%": RegExp, "%Set%": typeof Set === "undefined" ? i : Set, "%SetIteratorPrototype%": typeof Set === "undefined" || !E || !h ? i : h(new Set()[Symbol.iterator]()), "%SharedArrayBuffer%": typeof SharedArrayBuffer === "undefined" ? i : SharedArrayBuffer, "%String%": String, "%StringIteratorPrototype%": E && h ? h(""[Symbol.iterator]()) : i, "%Symbol%": E ? Symbol : i, "%SyntaxError%": r, "%ThrowTypeError%": e, "%TypedArray%": N, "%TypeError%": c, "%Uint8Array%": typeof Uint8Array === "undefined" ? i : Uint8Array, "%Uint8ClampedArray%": typeof Uint8ClampedArray === "undefined" ? i : Uint8ClampedArray, "%Uint16Array%": typeof Uint16Array === "undefined" ? i : Uint16Array, "%Uint32Array%": typeof Uint32Array === "undefined" ? i : Uint32Array, "%URIError%": URIError, "%WeakMap%": typeof WeakMap === "undefined" ? i : WeakMap, "%WeakRef%": typeof WeakRef === "undefined" ? i : WeakRef, "%WeakSet%": typeof WeakSet === "undefined" ? i : WeakSet };
  if (h)
    try {
      null.error;
    } catch (L) {
      v = h(h(L)), x["%Error.prototype%"] = v;
    }
  var v, j = function L(O) {
    var M;
    if (O === "%AsyncFunction%")
      M = u("async function () {}");
    else if (O === "%GeneratorFunction%")
      M = u("function* () {}");
    else if (O === "%AsyncGeneratorFunction%")
      M = u("async function* () {}");
    else if (O === "%AsyncGenerator%") {
      var W = L("%AsyncGeneratorFunction%");
      if (W)
        M = W.prototype;
    } else if (O === "%AsyncIteratorPrototype%") {
      var l = L("%AsyncGenerator%");
      if (l && h)
        M = h(l.prototype);
    }
    return x[O] = M, M;
  }, S = { "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"], "%ArrayPrototype%": ["Array", "prototype"], "%ArrayProto_entries%": ["Array", "prototype", "entries"], "%ArrayProto_forEach%": ["Array", "prototype", "forEach"], "%ArrayProto_keys%": ["Array", "prototype", "keys"], "%ArrayProto_values%": ["Array", "prototype", "values"], "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"], "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"], "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"], "%BooleanPrototype%": ["Boolean", "prototype"], "%DataViewPrototype%": ["DataView", "prototype"], "%DatePrototype%": ["Date", "prototype"], "%ErrorPrototype%": ["Error", "prototype"], "%EvalErrorPrototype%": ["EvalError", "prototype"], "%Float32ArrayPrototype%": ["Float32Array", "prototype"], "%Float64ArrayPrototype%": ["Float64Array", "prototype"], "%FunctionPrototype%": ["Function", "prototype"], "%Generator%": ["GeneratorFunction", "prototype"], "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"], "%Int8ArrayPrototype%": ["Int8Array", "prototype"], "%Int16ArrayPrototype%": ["Int16Array", "prototype"], "%Int32ArrayPrototype%": ["Int32Array", "prototype"], "%JSONParse%": ["JSON", "parse"], "%JSONStringify%": ["JSON", "stringify"], "%MapPrototype%": ["Map", "prototype"], "%NumberPrototype%": ["Number", "prototype"], "%ObjectPrototype%": ["Object", "prototype"], "%ObjProto_toString%": ["Object", "prototype", "toString"], "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"], "%PromisePrototype%": ["Promise", "prototype"], "%PromiseProto_then%": ["Promise", "prototype", "then"], "%Promise_all%": ["Promise", "all"], "%Promise_reject%": ["Promise", "reject"], "%Promise_resolve%": ["Promise", "resolve"], "%RangeErrorPrototype%": ["RangeError", "prototype"], "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"], "%RegExpPrototype%": ["RegExp", "prototype"], "%SetPrototype%": ["Set", "prototype"], "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"], "%StringPrototype%": ["String", "prototype"], "%SymbolPrototype%": ["Symbol", "prototype"], "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"], "%TypedArrayPrototype%": ["TypedArray", "prototype"], "%TypeErrorPrototype%": ["TypeError", "prototype"], "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"], "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"], "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"], "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"], "%URIErrorPrototype%": ["URIError", "prototype"], "%WeakMapPrototype%": ["WeakMap", "prototype"], "%WeakSetPrototype%": ["WeakSet", "prototype"] }, A = vt2(), T = at2(), d = A.call(Function.call, Array.prototype.concat), R = A.call(Function.apply, Array.prototype.splice), P = A.call(Function.call, String.prototype.replace), H = A.call(Function.call, String.prototype.slice), U = A.call(Function.call, RegExp.prototype.exec), a = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, G = /\\(\\)?/g, rt = function L(O) {
    var M = H(O, 0, 1), W = H(O, -1);
    if (M === "%" && W !== "%")
      throw new r("invalid intrinsic syntax, expected closing `%`");
    else if (W === "%" && M !== "%")
      throw new r("invalid intrinsic syntax, expected opening `%`");
    var l = [];
    return P(O, a, function(D, C, k, p) {
      l[l.length] = k ? P(p, G, "$1") : C || D;
    }), l;
  }, X = function L(O, M) {
    var W = O, l;
    if (T(S, W))
      l = S[W], W = "%" + l[0] + "%";
    if (T(x, W)) {
      var D = x[W];
      if (D === Y)
        D = j(W);
      if (typeof D === "undefined" && !M)
        throw new c("intrinsic " + O + " exists, but is not available. Please file an issue!");
      return { alias: l, name: W, value: D };
    }
    throw new r("intrinsic " + O + " does not exist!");
  };
  t.exports = function L(O, M) {
    if (typeof O !== "string" || O.length === 0)
      throw new c("intrinsic name must be a non-empty string");
    if (arguments.length > 1 && typeof M !== "boolean")
      throw new c('"allowMissing" argument must be a boolean');
    if (U(/^%?[^%]*%?$/, O) === null)
      throw new r("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    var W = rt(O), l = W.length > 0 ? W[0] : "", D = X("%" + l + "%", M), C = D.name, k = D.value, p = false, f = D.alias;
    if (f)
      l = f[0], R(W, d([0, 1], f));
    for (var V = 1, Z = true;V < W.length; V += 1) {
      var o = W[V], z = H(o, 0, 1), nt = H(o, -1);
      if ((z === '"' || z === "'" || z === "`" || (nt === '"' || nt === "'" || nt === "`")) && z !== nt)
        throw new r("property names with quotes must have matching quotes");
      if (o === "constructor" || !Z)
        p = true;
      if (l += "." + o, C = "%" + l + "%", T(x, C))
        k = x[C];
      else if (k != null) {
        if (!(o in k)) {
          if (!M)
            throw new c("base intrinsic for " + O + " exists, but the property is not available.");
          return;
        }
        if (I && V + 1 >= W.length) {
          var _ = I(k, o);
          if (Z = !!_, Z && "get" in _ && !("originalValue" in _.get))
            k = _.get;
          else
            k = k[o];
        } else
          Z = T(k, o), k = k[o];
        if (Z && !p)
          x[C] = k;
      }
    }
    return k;
  };
});
var Ft2 = b2((n, t) => {
  var i = pn2(), r = i("%Object.getOwnPropertyDescriptor%", true);
  if (r)
    try {
      r([], "length");
    } catch (m) {
      r = null;
    }
  t.exports = r;
});
var Dn2 = b2((n, t) => {
  var i = At2(), r = Ut2(), m = $t2(), c = Ft2();
  t.exports = function u(I, s, e) {
    if (!I || typeof I !== "object" && typeof I !== "function")
      throw new m("`obj` must be an object or a function`");
    if (typeof s !== "string" && typeof s !== "symbol")
      throw new m("`property` must be a string or a symbol`");
    if (arguments.length > 3 && typeof arguments[3] !== "boolean" && arguments[3] !== null)
      throw new m("`nonEnumerable`, if provided, must be a boolean or null");
    if (arguments.length > 4 && typeof arguments[4] !== "boolean" && arguments[4] !== null)
      throw new m("`nonWritable`, if provided, must be a boolean or null");
    if (arguments.length > 5 && typeof arguments[5] !== "boolean" && arguments[5] !== null)
      throw new m("`nonConfigurable`, if provided, must be a boolean or null");
    if (arguments.length > 6 && typeof arguments[6] !== "boolean")
      throw new m("`loose`, if provided, must be a boolean");
    var E = arguments.length > 3 ? arguments[3] : null, g = arguments.length > 4 ? arguments[4] : null, h = arguments.length > 5 ? arguments[5] : null, Y = arguments.length > 6 ? arguments[6] : false, N = !!c && c(I, s);
    if (i)
      i(I, s, { configurable: h === null && N ? N.configurable : !h, enumerable: E === null && N ? N.enumerable : !E, value: e, writable: g === null && N ? N.writable : !g });
    else if (Y || !E && !g && !h)
      I[s] = e;
    else
      throw new r("This environment does not support defining a property as non-configurable, non-writable, or non-enumerable.");
  };
});
var on2 = b2((n, t) => {
  var i = At2(), r = function m() {
    return !!i;
  };
  r.hasArrayLengthDefineBug = function m() {
    if (!i)
      return null;
    try {
      return i([], "length", { value: 1 }).length !== 1;
    } catch (c) {
      return true;
    }
  }, t.exports = r;
});
var Wn2 = b2((n, t) => {
  var i = Pt2(), r = Dn2(), m = on2()(), c = Ft2(), u = $t2(), I = i("%Math.floor%");
  t.exports = function s(e, E) {
    if (typeof e !== "function")
      throw new u("`fn` is not a function");
    if (typeof E !== "number" || E < 0 || E > 4294967295 || I(E) !== E)
      throw new u("`length` must be a positive 32-bit integer");
    var g = arguments.length > 2 && !!arguments[2], h = true, Y = true;
    if ("length" in e && c) {
      var N = c(e, "length");
      if (N && !N.configurable)
        h = false;
      if (N && !N.writable)
        Y = false;
    }
    if (h || Y || !g)
      if (m)
        r(e, "length", E, true, true);
      else
        r(e, "length", E);
    return e;
  };
});
var Bt2 = b2((n, t) => {
  var i = vt2(), r = Pt2(), m = Wn2(), c = $t2(), u = r("%Function.prototype.apply%"), I = r("%Function.prototype.call%"), s = r("%Reflect.apply%", true) || i.call(I, u), e = At2(), E = r("%Math.max%");
  t.exports = function h(Y) {
    if (typeof Y !== "function")
      throw new c("a function is required");
    var N = s(i, I, arguments);
    return m(N, 1 + E(0, Y.length - (arguments.length - 1)), true);
  };
  var g = function h() {
    return s(i, u, arguments);
  };
  if (e)
    e(t.exports, "apply", { value: g });
  else
    t.exports.apply = g;
});
var Ln2 = b2((n, t) => {
  var i = Pt2(), r = Bt2(), m = r(i("String.prototype.indexOf"));
  t.exports = function c(u, I) {
    var s = i(u, !!I);
    if (typeof s === "function" && m(u, ".prototype.") > -1)
      return r(s);
    return s;
  };
});
var Mn2 = b2((n, t) => {
  var i = (typeof JSON !== "undefined" ? JSON : $n2()).stringify, r = Pn2(), m = Tn2(), c = Bt2(), u = Ln2(), I = u("Array.prototype.join"), s = u("Array.prototype.push"), e = function g(h, Y) {
    var N = "";
    for (var x = 0;x < h; x += 1)
      N += Y;
    return N;
  }, E = function(g, h, Y) {
    return Y;
  };
  t.exports = function g(h) {
    var Y = arguments.length > 1 ? arguments[1] : undefined, N = Y && Y.space || "";
    if (typeof N === "number")
      N = e(N, " ");
    var x = !!Y && typeof Y.cycles === "boolean" && Y.cycles, v = Y && Y.replacer ? c(Y.replacer) : E, j = typeof Y === "function" ? Y : Y && Y.cmp, S = j && function(T) {
      var d = j.length > 2 && function R(P) {
        return T[P];
      };
      return function(R, P) {
        return j({ key: R, value: T[R] }, { key: P, value: T[P] }, d ? { __proto__: null, get: d } : undefined);
      };
    }, A = [];
    return function T(d, R, P, H) {
      var U = N ? `
` + e(H, N) : "", a = N ? ": " : ":";
      if (P && P.toJSON && typeof P.toJSON === "function")
        P = P.toJSON();
      if (P = v(d, R, P), P === undefined)
        return;
      if (typeof P !== "object" || P === null)
        return i(P);
      if (r(P)) {
        var L = [];
        for (var G = 0;G < P.length; G++) {
          var rt = T(P, G, P[G], H + 1) || i(null);
          s(L, U + N + rt);
        }
        return "[" + I(L, ",") + U + "]";
      }
      if (A.indexOf(P) !== -1) {
        if (x)
          return i("__cycle__");
        throw new TypeError("Converting circular structure to JSON");
      } else
        s(A, P);
      var X = m(P).sort(S && S(P)), L = [];
      for (var G = 0;G < X.length; G++) {
        var R = X[G], O = T(P, R, P[R], H + 1);
        if (!O)
          continue;
        var M = i(R) + a + O;
        s(L, U + N + M);
      }
      return A.splice(A.indexOf(P), 1), "{" + I(L, ",") + U + "}";
    }({ "": h }, "", h, 0);
  };
});
var pt2 = xn2(Mn2(), 1);
var Dt2 = function(n, t, i, r) {
  let m, c, u, I = t || [0], s = (i = i || 0) >>> 3, e = r === -1 ? 3 : 0;
  for (m = 0;m < n.length; m += 1)
    u = m + s, c = u >>> 2, I.length <= c && I.push(0), I[c] |= n[m] << 8 * (e + r * (u % 4));
  return { value: I, binLen: 8 * n.length + i };
};
var ht2 = function(n, t, i) {
  switch (t) {
    case "UTF8":
    case "UTF16BE":
    case "UTF16LE":
      break;
    default:
      throw new Error("encoding must be UTF8, UTF16BE, or UTF16LE");
  }
  switch (n) {
    case "HEX":
      return function(r, m, c) {
        return function(u, I, s, e) {
          let E, g, h, Y;
          if (u.length % 2 != 0)
            throw new Error("String of HEX type must be in byte increments");
          let N = I || [0], x = (s = s || 0) >>> 3, v = e === -1 ? 3 : 0;
          for (E = 0;E < u.length; E += 2) {
            if (g = parseInt(u.substr(E, 2), 16), isNaN(g))
              throw new Error("String of HEX type contains invalid characters");
            for (Y = (E >>> 1) + x, h = Y >>> 2;N.length <= h; )
              N.push(0);
            N[h] |= g << 8 * (v + e * (Y % 4));
          }
          return { value: N, binLen: 4 * u.length + s };
        }(r, m, c, i);
      };
    case "TEXT":
      return function(r, m, c) {
        return function(u, I, s, e, E) {
          let g, h, Y, N, x, v, j, S, A = 0, T = s || [0], d = (e = e || 0) >>> 3;
          if (I === "UTF8")
            for (j = E === -1 ? 3 : 0, Y = 0;Y < u.length; Y += 1)
              for (g = u.charCodeAt(Y), h = [], 128 > g ? h.push(g) : 2048 > g ? (h.push(192 | g >>> 6), h.push(128 | 63 & g)) : 55296 > g || 57344 <= g ? h.push(224 | g >>> 12, 128 | g >>> 6 & 63, 128 | 63 & g) : (Y += 1, g = 65536 + ((1023 & g) << 10 | 1023 & u.charCodeAt(Y)), h.push(240 | g >>> 18, 128 | g >>> 12 & 63, 128 | g >>> 6 & 63, 128 | 63 & g)), N = 0;N < h.length; N += 1) {
                for (v = A + d, x = v >>> 2;T.length <= x; )
                  T.push(0);
                T[x] |= h[N] << 8 * (j + E * (v % 4)), A += 1;
              }
          else
            for (j = E === -1 ? 2 : 0, S = I === "UTF16LE" && E !== 1 || I !== "UTF16LE" && E === 1, Y = 0;Y < u.length; Y += 1) {
              for (g = u.charCodeAt(Y), S === true && (N = 255 & g, g = N << 8 | g >>> 8), v = A + d, x = v >>> 2;T.length <= x; )
                T.push(0);
              T[x] |= g << 8 * (j + E * (v % 4)), A += 2;
            }
          return { value: T, binLen: 8 * A + e };
        }(r, t, m, c, i);
      };
    case "B64":
      return function(r, m, c) {
        return function(u, I, s, e) {
          let E, g, h, Y, N, x, v, j = 0, S = I || [0], A = (s = s || 0) >>> 3, T = e === -1 ? 3 : 0, d = u.indexOf("=");
          if (u.search(/^[a-zA-Z0-9=+/]+$/) === -1)
            throw new Error("Invalid character in base-64 string");
          if (u = u.replace(/=/g, ""), d !== -1 && d < u.length)
            throw new Error("Invalid '=' found in base-64 string");
          for (g = 0;g < u.length; g += 4) {
            for (N = u.substr(g, 4), Y = 0, h = 0;h < N.length; h += 1)
              E = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(N.charAt(h)), Y |= E << 18 - 6 * h;
            for (h = 0;h < N.length - 1; h += 1) {
              for (v = j + A, x = v >>> 2;S.length <= x; )
                S.push(0);
              S[x] |= (Y >>> 16 - 8 * h & 255) << 8 * (T + e * (v % 4)), j += 1;
            }
          }
          return { value: S, binLen: 8 * j + s };
        }(r, m, c, i);
      };
    case "BYTES":
      return function(r, m, c) {
        return function(u, I, s, e) {
          let E, g, h, Y, N = I || [0], x = (s = s || 0) >>> 3, v = e === -1 ? 3 : 0;
          for (g = 0;g < u.length; g += 1)
            E = u.charCodeAt(g), Y = g + x, h = Y >>> 2, N.length <= h && N.push(0), N[h] |= E << 8 * (v + e * (Y % 4));
          return { value: N, binLen: 8 * u.length + s };
        }(r, m, c, i);
      };
    case "ARRAYBUFFER":
      try {
        new ArrayBuffer(0);
      } catch (r) {
        throw new Error("ARRAYBUFFER not supported by this environment");
      }
      return function(r, m, c) {
        return function(u, I, s, e) {
          return Dt2(new Uint8Array(u), I, s, e);
        }(r, m, c, i);
      };
    case "UINT8ARRAY":
      try {
        new Uint8Array(0);
      } catch (r) {
        throw new Error("UINT8ARRAY not supported by this environment");
      }
      return function(r, m, c) {
        return Dt2(r, m, c, i);
      };
    default:
      throw new Error("format must be HEX, TEXT, B64, BYTES, ARRAYBUFFER, or UINT8ARRAY");
  }
};
var ot2 = function(n, t, i, r) {
  switch (n) {
    case "HEX":
      return function(m) {
        return function(c, u, I, s) {
          let e, E, g = "", h = u / 8, Y = I === -1 ? 3 : 0;
          for (e = 0;e < h; e += 1)
            E = c[e >>> 2] >>> 8 * (Y + I * (e % 4)), g += "0123456789abcdef".charAt(E >>> 4 & 15) + "0123456789abcdef".charAt(15 & E);
          return s.outputUpper ? g.toUpperCase() : g;
        }(m, t, i, r);
      };
    case "B64":
      return function(m) {
        return function(c, u, I, s) {
          let e, E, g, h, Y, N = "", x = u / 8, v = I === -1 ? 3 : 0;
          for (e = 0;e < x; e += 3)
            for (h = e + 1 < x ? c[e + 1 >>> 2] : 0, Y = e + 2 < x ? c[e + 2 >>> 2] : 0, g = (c[e >>> 2] >>> 8 * (v + I * (e % 4)) & 255) << 16 | (h >>> 8 * (v + I * ((e + 1) % 4)) & 255) << 8 | Y >>> 8 * (v + I * ((e + 2) % 4)) & 255, E = 0;E < 4; E += 1)
              N += 8 * e + 6 * E <= u ? "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(g >>> 6 * (3 - E) & 63) : s.b64Pad;
          return N;
        }(m, t, i, r);
      };
    case "BYTES":
      return function(m) {
        return function(c, u, I) {
          let s, e, E = "", g = u / 8, h = I === -1 ? 3 : 0;
          for (s = 0;s < g; s += 1)
            e = c[s >>> 2] >>> 8 * (h + I * (s % 4)) & 255, E += String.fromCharCode(e);
          return E;
        }(m, t, i);
      };
    case "ARRAYBUFFER":
      try {
        new ArrayBuffer(0);
      } catch (m) {
        throw new Error("ARRAYBUFFER not supported by this environment");
      }
      return function(m) {
        return function(c, u, I) {
          let s, e = u / 8, E = new ArrayBuffer(e), g = new Uint8Array(E), h = I === -1 ? 3 : 0;
          for (s = 0;s < e; s += 1)
            g[s] = c[s >>> 2] >>> 8 * (h + I * (s % 4)) & 255;
          return E;
        }(m, t, i);
      };
    case "UINT8ARRAY":
      try {
        new Uint8Array(0);
      } catch (m) {
        throw new Error("UINT8ARRAY not supported by this environment");
      }
      return function(m) {
        return function(c, u, I) {
          let s, e = u / 8, E = I === -1 ? 3 : 0, g = new Uint8Array(e);
          for (s = 0;s < e; s += 1)
            g[s] = c[s >>> 2] >>> 8 * (E + I * (s % 4)) & 255;
          return g;
        }(m, t, i);
      };
    default:
      throw new Error("format must be HEX, B64, BYTES, ARRAYBUFFER, or UINT8ARRAY");
  }
};
var jt2 = function(n, t) {
  let i, r, m = n.binLen >>> 3, c = t.binLen >>> 3, u = m << 3, I = 4 - m << 3;
  if (m % 4 != 0) {
    for (i = 0;i < c; i += 4)
      r = m + i >>> 2, n.value[r] |= t.value[i >>> 2] << u, n.value.push(0), n.value[r + 1] |= t.value[i >>> 2] >>> I;
    return (n.value.length << 2) - 4 >= c + m && n.value.pop(), { value: n.value, binLen: n.binLen + t.binLen };
  }
  return { value: n.value.concat(t.value), binLen: n.binLen + t.binLen };
};
var Wt2 = function(n) {
  let t = { outputUpper: false, b64Pad: "=", outputLen: -1 }, i = n || {};
  if (t.outputUpper = i.outputUpper || false, i.b64Pad && (t.b64Pad = i.b64Pad), i.outputLen) {
    if (i.outputLen % 8 != 0)
      throw new Error("Output length must be a multiple of 8");
    t.outputLen = i.outputLen;
  } else if (i.shakeLen) {
    if (i.shakeLen % 8 != 0)
      throw new Error("Output length must be a multiple of 8");
    t.outputLen = i.shakeLen;
  }
  if (typeof t.outputUpper != "boolean")
    throw new Error("Invalid outputUpper formatting option");
  if (typeof t.b64Pad != "string")
    throw new Error("Invalid b64Pad formatting option");
  return t;
};
var it2 = function(n, t, i, r) {
  let m = n + " must include a value and format";
  if (!t) {
    if (!r)
      throw new Error(m);
    return r;
  }
  if (t.value === undefined || !t.format)
    throw new Error(m);
  return ht2(t.format, t.encoding || "UTF8", i)(t.value);
};
var mt2 = function(n, t) {
  return n << t | n >>> 32 - t;
};
var B2 = function(n, t) {
  return n >>> t | n << 32 - t;
};
var Qt2 = function(n, t) {
  return n >>> t;
};
var Lt2 = function(n, t, i) {
  return n ^ t ^ i;
};
var Xt2 = function(n, t, i) {
  return n & t ^ ~n & i;
};
var zt2 = function(n, t, i) {
  return n & t ^ n & i ^ t & i;
};
var fn2 = function(n) {
  return B2(n, 2) ^ B2(n, 13) ^ B2(n, 22);
};
var K2 = function(n, t) {
  let i = (65535 & n) + (65535 & t);
  return (65535 & (n >>> 16) + (t >>> 16) + (i >>> 16)) << 16 | 65535 & i;
};
var Hn2 = function(n, t, i, r) {
  let m = (65535 & n) + (65535 & t) + (65535 & i) + (65535 & r);
  return (65535 & (n >>> 16) + (t >>> 16) + (i >>> 16) + (r >>> 16) + (m >>> 16)) << 16 | 65535 & m;
};
var ut2 = function(n, t, i, r, m) {
  let c = (65535 & n) + (65535 & t) + (65535 & i) + (65535 & r) + (65535 & m);
  return (65535 & (n >>> 16) + (t >>> 16) + (i >>> 16) + (r >>> 16) + (m >>> 16) + (c >>> 16)) << 16 | 65535 & c;
};
var ln2 = function(n) {
  return B2(n, 7) ^ B2(n, 18) ^ Qt2(n, 3);
};
var yn2 = function(n) {
  return B2(n, 6) ^ B2(n, 11) ^ B2(n, 25);
};
var Kn2 = function(n) {
  return [1732584193, 4023233417, 2562383102, 271733878, 3285377520];
};
var _t2 = function(n, t) {
  let i, r, m, c, u, I, s, e = [];
  for (i = t[0], r = t[1], m = t[2], c = t[3], u = t[4], s = 0;s < 80; s += 1)
    e[s] = s < 16 ? n[s] : mt2(e[s - 3] ^ e[s - 8] ^ e[s - 14] ^ e[s - 16], 1), I = s < 20 ? ut2(mt2(i, 5), Xt2(r, m, c), u, 1518500249, e[s]) : s < 40 ? ut2(mt2(i, 5), Lt2(r, m, c), u, 1859775393, e[s]) : s < 60 ? ut2(mt2(i, 5), zt2(r, m, c), u, 2400959708, e[s]) : ut2(mt2(i, 5), Lt2(r, m, c), u, 3395469782, e[s]), u = c, c = m, m = mt2(r, 30), r = i, i = I;
  return t[0] = K2(i, t[0]), t[1] = K2(r, t[1]), t[2] = K2(m, t[2]), t[3] = K2(c, t[3]), t[4] = K2(u, t[4]), t;
};
var Vn2 = function(n, t, i, r) {
  let m, c = 15 + (t + 65 >>> 9 << 4), u = t + i;
  for (;n.length <= c; )
    n.push(0);
  for (n[t >>> 5] |= 128 << 24 - t % 32, n[c] = 4294967295 & u, n[c - 1] = u / st2 | 0, m = 0;m < n.length; m += 16)
    r = _t2(n.slice(m, m + 16), r);
  return r;
};
var Mt2 = function(n) {
  let t;
  return t = n == "SHA-224" ? q2.slice() : tt2.slice(), t;
};
var ft2 = function(n, t) {
  let i, r, m, c, u, I, s, e, E, g, h, Y = [];
  for (i = t[0], r = t[1], m = t[2], c = t[3], u = t[4], I = t[5], s = t[6], e = t[7], h = 0;h < 64; h += 1)
    Y[h] = h < 16 ? n[h] : Hn2(B2(N = Y[h - 2], 17) ^ B2(N, 19) ^ Qt2(N, 10), Y[h - 7], ln2(Y[h - 15]), Y[h - 16]), E = ut2(e, yn2(u), Xt2(u, I, s), $2[h], Y[h]), g = K2(fn2(i), zt2(i, r, m)), e = s, s = I, I = u, u = K2(c, E), c = m, m = r, r = i, i = K2(E, g);
  var N;
  return t[0] = K2(i, t[0]), t[1] = K2(r, t[1]), t[2] = K2(m, t[2]), t[3] = K2(c, t[3]), t[4] = K2(u, t[4]), t[5] = K2(I, t[5]), t[6] = K2(s, t[6]), t[7] = K2(e, t[7]), t;
};
var Ht2 = function(n, t) {
  let i;
  return t > 32 ? (i = 64 - t, new w2(n.I << t | n.N >>> i, n.N << t | n.I >>> i)) : t !== 0 ? (i = 32 - t, new w2(n.N << t | n.I >>> i, n.I << t | n.N >>> i)) : n;
};
var Q2 = function(n, t) {
  let i;
  return t < 32 ? (i = 32 - t, new w2(n.N >>> t | n.I << i, n.I >>> t | n.N << i)) : (i = 64 - t, new w2(n.I >>> t | n.N << i, n.N >>> t | n.I << i));
};
var Jt2 = function(n, t) {
  return new w2(n.N >>> t, n.I >>> t | n.N << 32 - t);
};
var Un2 = function(n, t, i) {
  return new w2(n.N & t.N ^ n.N & i.N ^ t.N & i.N, n.I & t.I ^ n.I & i.I ^ t.I & i.I);
};
var Gn2 = function(n) {
  let t = Q2(n, 28), i = Q2(n, 34), r = Q2(n, 39);
  return new w2(t.N ^ i.N ^ r.N, t.I ^ i.I ^ r.I);
};
var F2 = function(n, t) {
  let i, r;
  i = (65535 & n.I) + (65535 & t.I), r = (n.I >>> 16) + (t.I >>> 16) + (i >>> 16);
  let m = (65535 & r) << 16 | 65535 & i;
  return i = (65535 & n.N) + (65535 & t.N) + (r >>> 16), r = (n.N >>> 16) + (t.N >>> 16) + (i >>> 16), new w2((65535 & r) << 16 | 65535 & i, m);
};
var Zn2 = function(n, t, i, r) {
  let m, c;
  m = (65535 & n.I) + (65535 & t.I) + (65535 & i.I) + (65535 & r.I), c = (n.I >>> 16) + (t.I >>> 16) + (i.I >>> 16) + (r.I >>> 16) + (m >>> 16);
  let u = (65535 & c) << 16 | 65535 & m;
  return m = (65535 & n.N) + (65535 & t.N) + (65535 & i.N) + (65535 & r.N) + (c >>> 16), c = (n.N >>> 16) + (t.N >>> 16) + (i.N >>> 16) + (r.N >>> 16) + (m >>> 16), new w2((65535 & c) << 16 | 65535 & m, u);
};
var an2 = function(n, t, i, r, m) {
  let c, u;
  c = (65535 & n.I) + (65535 & t.I) + (65535 & i.I) + (65535 & r.I) + (65535 & m.I), u = (n.I >>> 16) + (t.I >>> 16) + (i.I >>> 16) + (r.I >>> 16) + (m.I >>> 16) + (c >>> 16);
  let I = (65535 & u) << 16 | 65535 & c;
  return c = (65535 & n.N) + (65535 & t.N) + (65535 & i.N) + (65535 & r.N) + (65535 & m.N) + (u >>> 16), u = (n.N >>> 16) + (t.N >>> 16) + (i.N >>> 16) + (r.N >>> 16) + (m.N >>> 16) + (c >>> 16), new w2((65535 & u) << 16 | 65535 & c, I);
};
var gt2 = function(n, t) {
  return new w2(n.N ^ t.N, n.I ^ t.I);
};
var Fn2 = function(n) {
  let t = Q2(n, 19), i = Q2(n, 61), r = Jt2(n, 6);
  return new w2(t.N ^ i.N ^ r.N, t.I ^ i.I ^ r.I);
};
var Bn2 = function(n) {
  let t = Q2(n, 1), i = Q2(n, 8), r = Jt2(n, 7);
  return new w2(t.N ^ i.N ^ r.N, t.I ^ i.I ^ r.I);
};
var Qn2 = function(n) {
  let t = Q2(n, 14), i = Q2(n, 18), r = Q2(n, 41);
  return new w2(t.N ^ i.N ^ r.N, t.I ^ i.I ^ r.I);
};
var lt2 = function(n) {
  return n === "SHA-384" ? [new w2(3418070365, q2[0]), new w2(1654270250, q2[1]), new w2(2438529370, q2[2]), new w2(355462360, q2[3]), new w2(1731405415, q2[4]), new w2(41048885895, q2[5]), new w2(3675008525, q2[6]), new w2(1203062813, q2[7])] : [new w2(tt2[0], 4089235720), new w2(tt2[1], 2227873595), new w2(tt2[2], 4271175723), new w2(tt2[3], 1595750129), new w2(tt2[4], 2917565137), new w2(tt2[5], 725511199), new w2(tt2[6], 4215389547), new w2(tt2[7], 327033209)];
};
var yt2 = function(n, t) {
  let i, r, m, c, u, I, s, e, E, g, h, Y, N = [];
  for (i = t[0], r = t[1], m = t[2], c = t[3], u = t[4], I = t[5], s = t[6], e = t[7], h = 0;h < 80; h += 1)
    h < 16 ? (Y = 2 * h, N[h] = new w2(n[Y], n[Y + 1])) : N[h] = Zn2(Fn2(N[h - 2]), N[h - 7], Bn2(N[h - 15]), N[h - 16]), E = an2(e, Qn2(u), (v = I, j = s, new w2((x = u).N & v.N ^ ~x.N & j.N, x.I & v.I ^ ~x.I & j.I)), Jn2[h], N[h]), g = F2(Gn2(i), Un2(i, r, m)), e = s, s = I, I = u, u = F2(c, E), c = m, m = r, r = i, i = F2(E, g);
  var x, v, j;
  return t[0] = F2(i, t[0]), t[1] = F2(r, t[1]), t[2] = F2(m, t[2]), t[3] = F2(c, t[3]), t[4] = F2(u, t[4]), t[5] = F2(I, t[5]), t[6] = F2(s, t[6]), t[7] = F2(e, t[7]), t;
};
var Tt2 = function(n) {
  let t, i = [];
  for (t = 0;t < 5; t += 1)
    i[t] = [new w2(0, 0), new w2(0, 0), new w2(0, 0), new w2(0, 0), new w2(0, 0)];
  return i;
};
var Xn2 = function(n) {
  let t, i = [];
  for (t = 0;t < 5; t += 1)
    i[t] = n[t].slice();
  return i;
};
var Nt2 = function(n, t) {
  let i, r, m, c, u = [], I = [];
  if (n !== null)
    for (r = 0;r < n.length; r += 2)
      t[(r >>> 1) % 5][(r >>> 1) / 5 | 0] = gt2(t[(r >>> 1) % 5][(r >>> 1) / 5 | 0], new w2(n[r + 1], n[r]));
  for (i = 0;i < 24; i += 1) {
    for (c = Tt2(), r = 0;r < 5; r += 1)
      u[r] = (s = t[r][0], e = t[r][1], E = t[r][2], g = t[r][3], h = t[r][4], new w2(s.N ^ e.N ^ E.N ^ g.N ^ h.N, s.I ^ e.I ^ E.I ^ g.I ^ h.I));
    for (r = 0;r < 5; r += 1)
      I[r] = gt2(u[(r + 4) % 5], Ht2(u[(r + 1) % 5], 1));
    for (r = 0;r < 5; r += 1)
      for (m = 0;m < 5; m += 1)
        t[r][m] = gt2(t[r][m], I[r]);
    for (r = 0;r < 5; r += 1)
      for (m = 0;m < 5; m += 1)
        c[m][(2 * r + 3 * m) % 5] = Ht2(t[r][m], ni2[r][m]);
    for (r = 0;r < 5; r += 1)
      for (m = 0;m < 5; m += 1)
        t[r][m] = gt2(c[r][m], new w2(~c[(r + 1) % 5][m].N & c[(r + 2) % 5][m].N, ~c[(r + 1) % 5][m].I & c[(r + 2) % 5][m].I));
    t[0][0] = gt2(t[0][0], ti2[i]);
  }
  var s, e, E, g, h;
  return t;
};
var qt2 = function(n) {
  let t, i, r = 0, m = [0, 0], c = [4294967295 & n, n / st2 & 2097151];
  for (t = 6;t >= 0; t--)
    i = c[t >> 2] >>> 8 * t & 255, i === 0 && r === 0 || (m[r + 1 >> 2] |= i << 8 * (r + 1), r += 1);
  return r = r !== 0 ? r : 1, m[0] |= r, { value: r + 1 > 4 ? m : [m[0]], binLen: 8 + 8 * r };
};
var St2 = function(n) {
  return jt2(qt2(n.binLen), n);
};
var Kt2 = function(n, t) {
  let i, r = qt2(t);
  r = jt2(r, n);
  let m = t >>> 2, c = (m - r.value.length % m) % m;
  for (i = 0;i < c; i++)
    r.value.push(0);
  return r.value;
};
var st2 = 4294967296;
var $2 = [1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298];
var q2 = [3238371032, 914150663, 812702999, 4144912697, 4290775857, 1750603025, 1694076839, 3204075428];
var tt2 = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];
var wt2 = "Chosen SHA variant is not supported";
var tn2 = "Cannot set numRounds with MAC";

class et2 {
  constructor(n, t, i) {
    let r = i || {};
    if (this.t = t, this.i = r.encoding || "UTF8", this.numRounds = r.numRounds || 1, isNaN(this.numRounds) || this.numRounds !== parseInt(this.numRounds, 10) || 1 > this.numRounds)
      throw new Error("numRounds must a integer >= 1");
    this.o = n, this.h = [], this.u = 0, this.l = false, this.A = 0, this.H = false, this.S = [], this.p = [];
  }
  update(n) {
    let t, i = 0, r = this.m >>> 5, m = this.C(n, this.h, this.u), c = m.binLen, u = m.value, I = c >>> 5;
    for (t = 0;t < I; t += r)
      i + this.m <= c && (this.U = this.v(u.slice(t, t + r), this.U), i += this.m);
    return this.A += i, this.h = u.slice(i >>> 5), this.u = c % this.m, this.l = true, this;
  }
  getHash(n, t) {
    let i, r, m = this.R, c = Wt2(t);
    if (this.K) {
      if (c.outputLen === -1)
        throw new Error("Output length must be specified in options");
      m = c.outputLen;
    }
    let u = ot2(n, m, this.T, c);
    if (this.H && this.g)
      return u(this.g(c));
    for (r = this.F(this.h.slice(), this.u, this.A, this.L(this.U), m), i = 1;i < this.numRounds; i += 1)
      this.K && m % 32 != 0 && (r[r.length - 1] &= 16777215 >>> 24 - m % 32), r = this.F(r, m, 0, this.B(this.o), m);
    return u(r);
  }
  setHMACKey(n, t, i) {
    if (!this.M)
      throw new Error("Variant does not support HMAC");
    if (this.l)
      throw new Error("Cannot set MAC key after calling update");
    let r = ht2(t, (i || {}).encoding || "UTF8", this.T);
    this.k(r(n));
  }
  k(n) {
    let t = this.m >>> 3, i = t / 4 - 1, r;
    if (this.numRounds !== 1)
      throw new Error(tn2);
    if (this.H)
      throw new Error("MAC key already set");
    for (t < n.binLen / 8 && (n.value = this.F(n.value, n.binLen, 0, this.B(this.o), this.R));n.value.length <= i; )
      n.value.push(0);
    for (r = 0;r <= i; r += 1)
      this.S[r] = 909522486 ^ n.value[r], this.p[r] = 1549556828 ^ n.value[r];
    this.U = this.v(this.S, this.U), this.A = this.m, this.H = true;
  }
  getHMAC(n, t) {
    let i = Wt2(t);
    return ot2(n, this.R, this.T, i)(this.Y());
  }
  Y() {
    let n;
    if (!this.H)
      throw new Error("Cannot call getHMAC without first setting MAC key");
    let t = this.F(this.h.slice(), this.u, this.A, this.L(this.U), this.R);
    return n = this.v(this.p, this.B(this.o)), n = this.F(t, this.R, this.m, n, this.R), n;
  }
}
var zn2 = class extends et2 {
  constructor(n, t, i) {
    if (n !== "SHA-1")
      throw new Error(wt2);
    super(n, t, i);
    let r = i || {};
    this.M = true, this.g = this.Y, this.T = -1, this.C = ht2(this.t, this.i, this.T), this.v = _t2, this.L = function(m) {
      return m.slice();
    }, this.B = Kn2, this.F = Vn2, this.U = [1732584193, 4023233417, 2562383102, 271733878, 3285377520], this.m = 512, this.R = 160, this.K = false, r.hmacKey && this.k(it2("hmacKey", r.hmacKey, this.T));
  }
};
var _n2 = class extends et2 {
  constructor(n, t, i) {
    if (n !== "SHA-224" && n !== "SHA-256")
      throw new Error(wt2);
    super(n, t, i);
    let r = i || {};
    this.g = this.Y, this.M = true, this.T = -1, this.C = ht2(this.t, this.i, this.T), this.v = ft2, this.L = function(m) {
      return m.slice();
    }, this.B = Mt2, this.F = function(m, c, u, I) {
      return function(s, e, E, g, h) {
        let Y, N, x = 15 + (e + 65 >>> 9 << 4), v = e + E;
        for (;s.length <= x; )
          s.push(0);
        for (s[e >>> 5] |= 128 << 24 - e % 32, s[x] = 4294967295 & v, s[x - 1] = v / st2 | 0, Y = 0;Y < s.length; Y += 16)
          g = ft2(s.slice(Y, Y + 16), g);
        return N = h === "SHA-224" ? [g[0], g[1], g[2], g[3], g[4], g[5], g[6]] : g, N;
      }(m, c, u, I, n);
    }, this.U = Mt2(n), this.m = 512, this.R = n === "SHA-224" ? 224 : 256, this.K = false, r.hmacKey && this.k(it2("hmacKey", r.hmacKey, this.T));
  }
};

class w2 {
  constructor(n, t) {
    this.N = n, this.I = t;
  }
}
var Jn2 = [new w2($2[0], 3609767458), new w2($2[1], 602891725), new w2($2[2], 3964484399), new w2($2[3], 2173295548), new w2($2[4], 4081628472), new w2($2[5], 3053834265), new w2($2[6], 2937671579), new w2($2[7], 3664609560), new w2($2[8], 2734883394), new w2($2[9], 1164996542), new w2($2[10], 1323610764), new w2($2[11], 3590304994), new w2($2[12], 4068182383), new w2($2[13], 991336113), new w2($2[14], 633803317), new w2($2[15], 3479774868), new w2($2[16], 2666613458), new w2($2[17], 944711139), new w2($2[18], 2341262773), new w2($2[19], 2007800933), new w2($2[20], 1495990901), new w2($2[21], 1856431235), new w2($2[22], 3175218132), new w2($2[23], 2198950837), new w2($2[24], 3999719339), new w2($2[25], 766784016), new w2($2[26], 2566594879), new w2($2[27], 3203337956), new w2($2[28], 1034457026), new w2($2[29], 2466948901), new w2($2[30], 3758326383), new w2($2[31], 168717936), new w2($2[32], 1188179964), new w2($2[33], 1546045734), new w2($2[34], 1522805485), new w2($2[35], 2643833823), new w2($2[36], 2343527390), new w2($2[37], 1014477480), new w2($2[38], 1206759142), new w2($2[39], 344077627), new w2($2[40], 1290863460), new w2($2[41], 3158454273), new w2($2[42], 3505952657), new w2($2[43], 106217008), new w2($2[44], 3606008344), new w2($2[45], 1432725776), new w2($2[46], 1467031594), new w2($2[47], 851169720), new w2($2[48], 3100823752), new w2($2[49], 1363258195), new w2($2[50], 3750685593), new w2($2[51], 3785050280), new w2($2[52], 3318307427), new w2($2[53], 3812723403), new w2($2[54], 2003034995), new w2($2[55], 3602036899), new w2($2[56], 1575990012), new w2($2[57], 1125592928), new w2($2[58], 2716904306), new w2($2[59], 442776044), new w2($2[60], 593698344), new w2($2[61], 3733110249), new w2($2[62], 2999351573), new w2($2[63], 3815920427), new w2(3391569614, 3928383900), new w2(3515267271, 566280711), new w2(3940187606, 3454069534), new w2(4118630271, 4000239992), new w2(116418474, 1914138554), new w2(174292421, 2731055270), new w2(289380356, 3203993006), new w2(460393269, 320620315), new w2(685471733, 587496836), new w2(852142971, 1086792851), new w2(1017036298, 365543100), new w2(1126000580, 2618297676), new w2(1288033470, 3409855158), new w2(1501505948, 4234509866), new w2(1607167915, 987167468), new w2(1816402316, 1246189591)];
var qn2 = class extends et2 {
  constructor(n, t, i) {
    if (n !== "SHA-384" && n !== "SHA-512")
      throw new Error(wt2);
    super(n, t, i);
    let r = i || {};
    this.g = this.Y, this.M = true, this.T = -1, this.C = ht2(this.t, this.i, this.T), this.v = yt2, this.L = function(m) {
      return m.slice();
    }, this.B = lt2, this.F = function(m, c, u, I) {
      return function(s, e, E, g, h) {
        let Y, N, x = 31 + (e + 129 >>> 10 << 5), v = e + E;
        for (;s.length <= x; )
          s.push(0);
        for (s[e >>> 5] |= 128 << 24 - e % 32, s[x] = 4294967295 & v, s[x - 1] = v / st2 | 0, Y = 0;Y < s.length; Y += 32)
          g = yt2(s.slice(Y, Y + 32), g);
        return N = h === "SHA-384" ? [g[0].N, g[0].I, g[1].N, g[1].I, g[2].N, g[2].I, g[3].N, g[3].I, g[4].N, g[4].I, g[5].N, g[5].I] : [g[0].N, g[0].I, g[1].N, g[1].I, g[2].N, g[2].I, g[3].N, g[3].I, g[4].N, g[4].I, g[5].N, g[5].I, g[6].N, g[6].I, g[7].N, g[7].I], N;
      }(m, c, u, I, n);
    }, this.U = lt2(n), this.m = 1024, this.R = n === "SHA-384" ? 384 : 512, this.K = false, r.hmacKey && this.k(it2("hmacKey", r.hmacKey, this.T));
  }
};
var ti2 = [new w2(0, 1), new w2(0, 32898), new w2(2147483648, 32906), new w2(2147483648, 2147516416), new w2(0, 32907), new w2(0, 2147483649), new w2(2147483648, 2147516545), new w2(2147483648, 32777), new w2(0, 138), new w2(0, 136), new w2(0, 2147516425), new w2(0, 2147483658), new w2(0, 2147516555), new w2(2147483648, 139), new w2(2147483648, 32905), new w2(2147483648, 32771), new w2(2147483648, 32770), new w2(2147483648, 128), new w2(0, 32778), new w2(2147483648, 2147483658), new w2(2147483648, 2147516545), new w2(2147483648, 32896), new w2(0, 2147483649), new w2(2147483648, 2147516424)];
var ni2 = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]];
var ii2 = class extends et2 {
  constructor(n, t, i) {
    let r = 6, m = 0;
    super(n, t, i);
    let c = i || {};
    if (this.numRounds !== 1) {
      if (c.kmacKey || c.hmacKey)
        throw new Error(tn2);
      if (this.o === "CSHAKE128" || this.o === "CSHAKE256")
        throw new Error("Cannot set numRounds for CSHAKE variants");
    }
    switch (this.T = 1, this.C = ht2(this.t, this.i, this.T), this.v = Nt2, this.L = Xn2, this.B = Tt2, this.U = Tt2(), this.K = false, n) {
      case "SHA3-224":
        this.m = m = 1152, this.R = 224, this.M = true, this.g = this.Y;
        break;
      case "SHA3-256":
        this.m = m = 1088, this.R = 256, this.M = true, this.g = this.Y;
        break;
      case "SHA3-384":
        this.m = m = 832, this.R = 384, this.M = true, this.g = this.Y;
        break;
      case "SHA3-512":
        this.m = m = 576, this.R = 512, this.M = true, this.g = this.Y;
        break;
      case "SHAKE128":
        r = 31, this.m = m = 1344, this.R = -1, this.K = true, this.M = false, this.g = null;
        break;
      case "SHAKE256":
        r = 31, this.m = m = 1088, this.R = -1, this.K = true, this.M = false, this.g = null;
        break;
      case "KMAC128":
        r = 4, this.m = m = 1344, this.X(i), this.R = -1, this.K = true, this.M = false, this.g = this._;
        break;
      case "KMAC256":
        r = 4, this.m = m = 1088, this.X(i), this.R = -1, this.K = true, this.M = false, this.g = this._;
        break;
      case "CSHAKE128":
        this.m = m = 1344, r = this.O(i), this.R = -1, this.K = true, this.M = false, this.g = null;
        break;
      case "CSHAKE256":
        this.m = m = 1088, r = this.O(i), this.R = -1, this.K = true, this.M = false, this.g = null;
        break;
      default:
        throw new Error(wt2);
    }
    this.F = function(u, I, s, e, E) {
      return function(g, h, Y, N, x, v, j) {
        let S, A, T = 0, d = [], R = x >>> 5, P = h >>> 5;
        for (S = 0;S < P && h >= x; S += R)
          N = Nt2(g.slice(S, S + R), N), h -= x;
        for (g = g.slice(S), h %= x;g.length < R; )
          g.push(0);
        for (S = h >>> 3, g[S >> 2] ^= v << S % 4 * 8, g[R - 1] ^= 2147483648, N = Nt2(g, N);32 * d.length < j && (A = N[T % 5][T / 5 | 0], d.push(A.I), !(32 * d.length >= j)); )
          d.push(A.N), T += 1, 64 * T % x == 0 && (Nt2(null, N), T = 0);
        return d;
      }(u, I, 0, e, m, r, E);
    }, c.hmacKey && this.k(it2("hmacKey", c.hmacKey, this.T));
  }
  O(n, t) {
    let i = function(m) {
      let c = m || {};
      return { funcName: it2("funcName", c.funcName, 1, { value: [], binLen: 0 }), customization: it2("Customization", c.customization, 1, { value: [], binLen: 0 }) };
    }(n || {});
    t && (i.funcName = t);
    let r = jt2(St2(i.funcName), St2(i.customization));
    if (i.customization.binLen !== 0 || i.funcName.binLen !== 0) {
      let m = Kt2(r, this.m >>> 3);
      for (let c = 0;c < m.length; c += this.m >>> 5)
        this.U = this.v(m.slice(c, c + (this.m >>> 5)), this.U), this.A += this.m;
      return 4;
    }
    return 31;
  }
  X(n) {
    let t = function(r) {
      let m = r || {};
      return { kmacKey: it2("kmacKey", m.kmacKey, 1), funcName: { value: [1128353099], binLen: 32 }, customization: it2("Customization", m.customization, 1, { value: [], binLen: 0 }) };
    }(n || {});
    this.O(n, t.funcName);
    let i = Kt2(St2(t.kmacKey), this.m >>> 3);
    for (let r = 0;r < i.length; r += this.m >>> 5)
      this.U = this.v(i.slice(r, r + (this.m >>> 5)), this.U), this.A += this.m;
    this.H = true;
  }
  _(n) {
    let t = jt2({ value: this.h.slice(), binLen: this.u }, function(i) {
      let r, m, c = 0, u = [0, 0], I = [4294967295 & i, i / st2 & 2097151];
      for (r = 6;r >= 0; r--)
        m = I[r >> 2] >>> 8 * r & 255, m === 0 && c === 0 || (u[c >> 2] |= m << 8 * c, c += 1);
      return c = c !== 0 ? c : 1, u[c >> 2] |= c << 8 * c, { value: c + 1 > 4 ? u : [u[0]], binLen: 8 + 8 * c };
    }(n.outputLen));
    return this.F(t.value, t.binLen, this.A, this.L(this.U), n.outputLen);
  }
};

class nn2 {
  constructor(n, t, i) {
    if (n == "SHA-1")
      this.P = new zn2(n, t, i);
    else if (n == "SHA-224" || n == "SHA-256")
      this.P = new _n2(n, t, i);
    else if (n == "SHA-384" || n == "SHA-512")
      this.P = new qn2(n, t, i);
    else {
      if (n != "SHA3-224" && n != "SHA3-256" && n != "SHA3-384" && n != "SHA3-512" && n != "SHAKE128" && n != "SHAKE256" && n != "CSHAKE128" && n != "CSHAKE256" && n != "KMAC128" && n != "KMAC256")
        throw new Error(wt2);
      this.P = new ii2(n, t, i);
    }
  }
  update(n) {
    return this.P.update(n), this;
  }
  getHash(n, t) {
    return this.P.getHash(n, t);
  }
  setHMACKey(n, t, i) {
    this.P.setHMACKey(n, t, i);
  }
  getHMAC(n, t) {
    return this.P.getHMAC(n, t);
  }
}
var xt2 = function(n, t, i = 0) {
  let r = pt2.default({ ...n, signature: undefined }), m = t.noTimeWindow ? 0 : Math.floor(Date.now() / (t.timeWindow ?? hn2)) + i;
  return new nn2("SHA-256", "TEXT", { encoding: "UTF8" }).update(r).update(pt2.default(t)).update(`${m}`).getHash("B64");
};
function rn2(n, t = {}) {
  return { ...n, signature: xt2(n, t) };
}
var hn2 = 5000;

class kt2 {
  data = [];
  #t = new TextEncoder;
  static payload(n, t, i) {
    return new kt2().payload(n, t, i);
  }
  static blob(n, t) {
    return new kt2().blob(n, t);
  }
  #n(n) {
    let t = this.#t.encode(n), i = new Uint8Array([t.byteLength]);
    this.data.push(i.buffer), this.data.push(t.buffer);
  }
  payload(n, t, i) {
    this.#n(n);
    let r = new Uint8Array([1]);
    this.data.push(r.buffer);
    let m = JSON.stringify(i ? rn2(t, { secret: i }) : t), c = this.#t.encode(m), u = new Uint32Array([c.byteLength]);
    return this.data.push(u.buffer), this.data.push(c.buffer), this;
  }
  blob(n, t) {
    this.#n(n);
    let i = new Uint8Array([2]);
    this.data.push(i.buffer);
    let r = new Uint32Array([t.size]);
    return this.data.push(r.buffer), this.data.push(t), this;
  }
  build() {
    return new Blob(this.data);
  }
}
var y2 = [];
for (let n = 0;n < 256; ++n)
  y2.push((n + 256).toString(16).slice(1));
var mi2 = new Uint8Array(16);
var hi2 = typeof crypto !== "undefined" && crypto.randomUUID && crypto.randomUUID.bind(crypto);
var sn2 = new TextDecoder;

// ../src/WebRTCSyncClient.ts
function createSyncClient(connector, root = {}) {
  const syncClient = new SyncClient(() => {
    connector.addOnNewClient((peer) => {
      const updates = [];
      const now = Date.now();
      Object.entries(syncClient.state).forEach(([key, value]) => {
        updates.push({
          path: key,
          value: syncClient.state[value],
          confirmed: now
        });
      });
      const welcomeBlobBuilder = kt2.payload("payload", {
        myClientId: peer,
        updates
      });
      connector.sendData(welcomeBlobBuilder.build());
    });
    connector.addCloseListener((peer) => {
      syncClient.setData(`clients/${peer}`, undefined, {
        active: true,
        flush: true
      });
    });
    return {
      send(data) {
        if (data instanceof Blob) {
          connector.sendData(data);
        }
      },
      onMessage(listener) {
        connector.addDataListener(listener);
      },
      onClose(listener) {
        connector.addOnDestroy(listener);
      },
      onError(listener) {
        connector.addOnError(listener);
      },
      close() {
        connector.destroy();
      }
    };
  }, root);
  return syncClient;
}

// ../src/Connector.ts
class Connector {
  uid;
  room;
  kvStore;
  makeUrl;
  channels = new Map;
  onData = new Set;
  onClosePeer = new Set;
  onNewClient = new Set;
  onError = new Set;
  onDestroy = new Set;
  maxUsers;
  constructor({
    uid = crypto.randomUUID(),
    makeUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.set("room", this.room);
      url.searchParams.set("host", this.uid);
      return url.toString();
    },
    kvStore,
    room,
    host,
    maxUsers = Number.MAX_SAFE_INTEGER
  }) {
    this.kvStore = kvStore;
    this.makeUrl = makeUrl;
    this.uid = uid;
    this.room = room;
    this.maxUsers = maxUsers;
    this.checkBeaconFailures();
    if (host) {
      this.makeOffer(host);
    } else {
      this.enableClientReceiver();
    }
  }
  enableClientReceiver() {
    const interval = setInterval(async () => {
      await this.checkClients();
      if (this.channels.size >= this.maxUsers) {
        clearInterval(interval);
      }
    }, 1000);
  }
  async makeOffer(host) {
    if (this.channels.has(host) || this.channels.size >= this.maxUsers) {
      return;
    }
    const channel = new PeerChannel(this, this.kvStore);
    this.channels.set(host, channel);
    await channel.makeOffer(host);
  }
  async acceptOffer(peer, offer) {
    if (this.channels.has(peer) || this.channels.size >= this.maxUsers) {
      return;
    }
    const channel = new PeerChannel(this, this.kvStore);
    this.channels.set(peer, channel);
    await channel.acceptOffer(peer, offer);
  }
  receiveData(data) {
    this.onData.forEach((callback) => callback(data));
  }
  addDataListener(callback) {
    this.onData.add(callback);
  }
  addCloseListener(callback) {
    this.onClosePeer.add(callback);
  }
  addOnError(callback) {
    this.onError.add(callback);
  }
  addOnNewClient(callback) {
    this.onNewClient.add(callback);
  }
  addOnDestroy(callback) {
    this.onDestroy.add(callback);
  }
  async checkClients() {
    const entries = Object.entries(await this.kvStore.list());
    entries.filter(([key]) => {
      return key.startsWith(`${this.room}_${this.uid}_offer_from_`);
    }).forEach(async ([key, offer]) => {
      const [, peer] = key.split(`${this.room}_${this.uid}_offer_from_`);
      if (peer?.length) {
        await this.acceptOffer(peer, offer);
      }
      this.onNewClient.forEach((callback) => {
        callback(peer);
      });
    });
  }
  sendData(blob, peer) {
    if (!peer) {
      this.channels.keys().forEach((peer2) => this.sendData(blob, peer2));
    } else {
      this.channels.get(peer)?.sendData(blob);
    }
  }
  checkBeaconFailures() {
    const failure = localStorage.getItem("beaconFailure");
    if (failure) {
      console.warn(failure);
      localStorage.removeItem("beaconFailure");
    }
  }
  async getQRCode() {
    const { code, url } = await new Promise((resolve, reject) => {
      const url2 = this.makeUrl();
      import_qrcode.default.toDataURL(url2, (err, code2) => {
        if (err) {
          reject(err);
        } else {
          resolve({ code: code2, url: url2 });
        }
      });
    });
    return { code, url };
  }
  createProcessor(root = {}, properties = {}) {
    const context = {
      root,
      outgoingUpdates: [],
      properties
    };
    const processor = new Processor((blob) => this.sendData(blob));
    this.addDataListener(async (data) => {
      if (data instanceof ArrayBuffer) {
        const blob = new Blob([data], { type: "application/octet-stream" });
        await processor.receivedBlob(blob, context);
      }
    });
    return { processor, context };
  }
  createSyncClient(root = {}) {
    return createSyncClient(this, root);
  }
  destroy() {
    this.channels.forEach((channel) => channel.destroy());
    this.onDestroy.forEach((callback) => callback());
  }
}
// src/index.tsx
var url = new URL(location.href);
var room = url.searchParams.get("room") ?? "sample";
var host = url.searchParams.get("host") ?? undefined;
var connector = new Connector({
  kvStore: firebaseWrappedServer("https://firebase.dobuki.net"),
  room,
  host
});
var data = {
  config: {
    activeUpdates: true
  }
};
var syncClient = connector.createSyncClient(data);
var button = document.body.appendChild(document.createElement("button"));
button.textContent = "Click";
button.addEventListener("click", () => {
  syncClient.setData("test", Date.now(), {
    active: true
  });
});
displayUsers(syncClient);
var div = document.body.appendChild(document.createElement("div"));
div.style.whiteSpace = "pre";
syncClient.observe(`test`).onChange((value) => {
  div.textContent = value;
});
if (!host) {
  connector.getQRCode().then(({ code, url: url2 }) => {
    const qr = document.querySelector("#qr-code");
    if (qr) {
      qr.src = code;
      qr.style.display = "";
    }
    const link = document.querySelector("#qr-link");
    if (link) {
      link.href = url2;
    }
  });
  window.connector = connector;
}
addEventListener("unload", () => {
  connector.destroy();
});
window.data = data;
