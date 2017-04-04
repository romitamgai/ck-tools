# ck-tools

Usage

1. Getting Schools data
    1. Prerequisites 
        - Excel file with the school information in the specified format (Refer: excel/sample_files/schooldata.xlsx)
        - Excel file with the school Id to CIP Mapping in the specified format (Refer: excel/sample_files/schoolid_cip.xls)
        - Excel data should have same heading as given in the sample file
        - Excel file should have sheet name as 'Sheet1' else cli option for sheet should be provided with sheetname (Eg: Run `node get-product-def.js --help` for further information)
    2. Getting School data in JSON fomat (If CIP Mapping is not provided)
        - Navigate to folder excel
        - Run `node get-product-def.js --schools -f <Excel file for school data>` (Eg: `node get-product-def.js --schools -f "sample_files/schooldata.xlsx"`)
    3. Getting School data with its majors in JSON format (If CIP Mapping is provided)
        - Navigate to folder excel
        - Run `node get-product-def.js --cip -f <Excel file for School Id to CIP>` (Eg: `node get-product-def.js --cip -f "sample_files/schoolid_cip.xls" `)
        - Run `node get-product-def.js --schools -f <Excel file for school data>`
  
    
