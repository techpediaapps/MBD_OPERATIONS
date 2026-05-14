import * as fs from 'fs';

let code = fs.readFileSync('src/pages/EmployeeManager.tsx', 'utf-8');
code = code.replace(/export default function EmployeeManager/g, 'export default function ShopfloorManager');
code = code.replace(/>Staff Management<\/h2>/g, '>Shopfloor Management</h2>');
code = code.replace(/>Training By Employees<\/h2>/g, '>Training By Employees (Shopfloor)</h2>');
fs.writeFileSync('src/pages/ShopfloorManager.tsx', code);

