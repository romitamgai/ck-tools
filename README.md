# ck-tools

Usage

1. Getting Schools data
    1. Prerequisites 
        - Excel file with the school information in the specified format (Refer: sample_files/schooldata.xlsx)
        - Excel file with the school Id to CIP Mapping in the specified format (Refer: sample_files/schoolid_cip.xls)
    2. Getting School data in JSON fomat
        - Navigate to folder excel
        - Run `node get-product-def.js --schools -f <Excel file for school data>` (Eg: `node get-product-def.js --schools -f "sample_files/schooldata.xlsx"`)
    3. Getting School data with its majors in JSON format
        - Navigate to folder excel
        - Run `node get-product-def.js -f <Excel file for School Id to CIP>` (Eg: `node get-product-def.js --schools -f "sample_files/schoolid_cip.xls"`)
        - Run `node get-product-def.js -f <Excel file for school data>`
  
    
