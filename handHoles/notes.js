const XLSX = require('xlsx');
var workbook = XLSX.readFile('out.xlsx');
var first_sheet_name = workbook.SheetNames[0];
var worksheet = workbook.Sheets[first_sheet_name];

var address_of_cell = 'A1';
var desired_cell = worksheet[address_of_cell];
var desired_value = desired_cell ? desired_cell.w : undefined;

console.log(desired_cell)

var new_address = getFreeLine(worksheet);
console.log(new_address)

var new_cell = worksheet[new_address];
new_cell = {
  w: desired_cell.w + 10,
}

console.log(new_cell)

XLSX.writeFile(workbook, 'out2.xlsx');

// re-read
// var workbook2 = XLSX.readFile('out.xlsx');
// var first_sheet_name = workbook2.SheetNames[0];
// var worksheet = workbook2.Sheets[first_sheet_name];
//
// var desired_cell = worksheet[new_address];
// var desired_value = (desired_cell ? desired_cell.w : undefined);

// find first free line
function getFreeLine(ws){
  var cell_address = 'A1';
  var i = 1;
  while (ws[cell_address] && ws[cell_address].v !== undefined){
    i++;
    cell_address = 'A' + i;
  }
  return cell_address;
}
