// Test script untuk validasi payload
// Node.js test untuk memastikan fungsi validateAndNormalizeValue bekerja dengan benar

// Simulated datastream configurations based on db.sql
const testDatastreams = [
  {
    id: 1,
    pin: 'V0',
    type: 'double',
    min_value: 0.0,
    max_value: 14.0,
    decimal_value: '0.00',
    description: 'pH Sensor'
  },
  {
    id: 2,
    pin: 'V1', 
    type: 'double',
    min_value: 0.0,
    max_value: 100.0,
    decimal_value: '0.0',
    description: 'Flow Sensor'
  },
  {
    id: 3,
    pin: 'V2',
    type: 'integer',
    min_value: 0.0,
    max_value: 200.0,
    decimal_value: '0',
    description: 'COD Sensor'
  },
  {
    id: 4,
    pin: 'V6',
    type: 'boolean',
    min_value: 0.0,
    max_value: 1.0,
    decimal_value: '0',
    description: 'LED Control'
  }
];

// Simplified validation function (copied from utils.ts)
function validateAndNormalizeValue(value, datastream) {
  let numericValue;
  let hasWarning = false;
  let warningMessage = '';

  // Konversi ke number jika belum
  if (typeof value === 'string') {
    numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      throw new Error(`Invalid numeric value: ${value}`);
    }
  } else if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'boolean') {
    numericValue = value ? 1 : 0;
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }

  // Validasi untuk tipe data tertentu
  if (datastream.type === 'integer') {
    numericValue = Math.round(numericValue);
  } else if (datastream.type === 'boolean') {
    numericValue = numericValue ? 1 : 0;
  }

  // Clamping untuk min/max values
  const originalValue = numericValue;
  if (numericValue < datastream.min_value) {
    numericValue = datastream.min_value;
    hasWarning = true;
    warningMessage = `Value ${originalValue} clamped to minimum ${datastream.min_value}`;
  } else if (numericValue > datastream.max_value) {
    numericValue = datastream.max_value;
    hasWarning = true;
    warningMessage = `Value ${originalValue} clamped to maximum ${datastream.max_value}`;
  }

  // Pembulatan sesuai decimal_value untuk tipe double
  if (datastream.type === 'double' && datastream.decimal_value) {
    // decimal_value format: '0.0', '0.00', '0.000', '0.0000'
    const decimalStr = datastream.decimal_value.toString();
    const decimalPlaces = decimalStr.includes('.') ? decimalStr.split('.')[1].length : 0;
    
    if (decimalPlaces > 0) {
      const factor = Math.pow(10, decimalPlaces);
      numericValue = Math.round(numericValue * factor) / factor;
    } else {
      // Jika decimal_value adalah '0' atau tidak ada desimal
      numericValue = Math.round(numericValue);
    }
  }

  return { validatedValue: numericValue, hasWarning, warningMessage };
}

// Test Cases
console.log('=== Payload Validation Test Cases ===\n');

// Test 1: pH Sensor - normal value
const test1 = validateAndNormalizeValue(7.856, testDatastreams[0]);
console.log('Test 1 - pH Normal (7.856 -> 2 decimal places):');
console.log('Result:', test1);
console.log('Expected: 7.86\n');

// Test 2: pH Sensor - value above max
const test2 = validateAndNormalizeValue(15.234, testDatastreams[0]);
console.log('Test 2 - pH Above Max (15.234 -> clamp to 14.0):');
console.log('Result:', test2);
console.log('Expected: 14.00 with warning\n');

// Test 3: Flow Sensor - value below min
const test3 = validateAndNormalizeValue(-5.67, testDatastreams[1]);
console.log('Test 3 - Flow Below Min (-5.67 -> clamp to 0.0):');
console.log('Result:', test3);
console.log('Expected: 0.0 with warning\n');

// Test 4: Flow Sensor - 1 decimal place
const test4 = validateAndNormalizeValue(25.789, testDatastreams[1]);
console.log('Test 4 - Flow 1 Decimal (25.789 -> 1 decimal place):');
console.log('Result:', test4);
console.log('Expected: 25.8\n');

// Test 5: Integer type (COD Sensor)
const test5 = validateAndNormalizeValue(45.67, testDatastreams[2]);
console.log('Test 5 - Integer Type (45.67 -> rounded):');
console.log('Result:', test5);
console.log('Expected: 46\n');

// Test 6: Boolean type
const test6 = validateAndNormalizeValue(true, testDatastreams[3]);
console.log('Test 6 - Boolean True:');
console.log('Result:', test6);
console.log('Expected: 1\n');

const test7 = validateAndNormalizeValue(false, testDatastreams[3]);
console.log('Test 7 - Boolean False:');
console.log('Result:', test7);
console.log('Expected: 0\n');

// Test 8: String input
const test8 = validateAndNormalizeValue("6.789", testDatastreams[0]);
console.log('Test 8 - String Input ("6.789"):');
console.log('Result:', test8);
console.log('Expected: 6.79\n');

console.log('=== Test Completed ===');
