import * as fs from 'fs';

let code = fs.readFileSync('src/pages/TrainingManager.tsx', 'utf-8');
code = code.replace(/export default function TrainingManager/g, 'export default function ShopfloorTrainingManager');
code = code.replace(/<Mail size={14} \/> Notify attendees/g, '');
code = code.replace(/<button onClick={handleNotifyAttendees}[^>]*>[\s\S]*?<\/button>/g, '');
code = code.replace(/const handleNotifyAttendees = async \(\) => {[\s\S]*?};/g, '');
code = code.replace(/>Training Manager<\/h2>/g, '>Shopfloor Training Manager</h2>');
fs.writeFileSync('src/pages/ShopfloorTrainingManager.tsx', code);
