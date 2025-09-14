const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'database', 'pistonary.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking database schema...');

// Check table schema
db.all("PRAGMA table_info(car)", (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('Car table columns:');
    rows.forEach(row => {
        console.log(`- ${row.name}: ${row.type} (pk: ${row.pk}, notnull: ${row.notnull}, default: ${row.dflt_value})`);
    });
    
    // Check if useIndividualIntervals column exists
    const hasUseIndividualIntervals = rows.some(row => row.name === 'useIndividualIntervals');
    console.log(`\nuseIndividualIntervals column exists: ${hasUseIndividualIntervals}`);
    
    if (!hasUseIndividualIntervals) {
        console.log('Adding useIndividualIntervals column...');
        db.run("ALTER TABLE car ADD COLUMN useIndividualIntervals BOOLEAN DEFAULT 0", (err) => {
            if (err) {
                console.error('Error adding column:', err);
            } else {
                console.log('Column added successfully!');
            }
            db.close();
        });
    } else {
        // Test updating and retrieving the value
        console.log('\nTesting update and select...');
        db.run("UPDATE car SET useIndividualIntervals = 1 WHERE id = 1", (err) => {
            if (err) {
                console.error('Error updating:', err);
            } else {
                console.log('Update successful');
            }
            
            db.get("SELECT useStandardIntervals, useIndividualIntervals FROM car WHERE id = 1", (err, row) => {
                if (err) {
                    console.error('Error selecting:', err);
                } else {
                    console.log('Current values:', row);
                }
                db.close();
            });
        });
    }
});