await runReport();


async function runReport() {
    let table = base.getTable('Product Backlog'); // replace Product Backlog with Unified Product Backlog
    //create a 'Transformed Data Table'
    //make sure the table has the following fields
    // Datapoint - single line text/primary field
    // Data Type - single line text
    // Reportable Number - Number field
    // Date - Single line text field, we'll format it later
    // Date Formatted - formula field with the formula (DATESTR({Date}))
    // Report Ran - single line text

    //this makes it so you can surface a graph  on the FDE Dashboard if you'd like
    let transformedTable = base.getTable('Transformed Data Table')
    const query = await table.selectRecordsAsync();

    const openTicketsByMonth = [];

    for (const record of query.records) {
    const doneDate = record.getCellValue('Done Date');
    if (!doneDate) {
        const createdDate = record.getCellValue('Created Date');
        const monthYear = getMonthYear(createdDate);
        if (monthYear >= '2021-01') { // Starting from January 2021
        const existingEntry = openTicketsByMonth.find(entry => entry.date === monthYear);
        if (existingEntry) {
            existingEntry.count++;
        } else {
            openTicketsByMonth.push({ date: monthYear, count: 1 });
        }
        }
    }
    }

    openTicketsByMonth.sort((a, b) => (a.date > b.date) ? 1 : -1);

    const renamedArray = openTicketsByMonth.map(obj => {
        const {date, count} = obj; // Destructure the object and extract old key values
        const Date = date; // Rename oldKey1 to newKey1
        const BacklogSize = count; // Rename oldKey2 to newKey2
        return { Date, BacklogSize}; // Construct a new object with renamed keys
    });
    output.table(renamedArray);

    let createBatch = [];

    for (let rec of renamedArray) {
        let newRecord = {fields: {'Datapoint': 'Backlog Size',
                                'Data Type': 'Backlog',
                                'Reportable Number': rec.BacklogSize,
                                'Date': rec.Date,  
                                'Report Ran': new Date().toString()      
        }}
        createBatch.push(newRecord)
    }
    console.log(createBatch)
    // Batch create operation
    while (createBatch.length > 0) {
        await transformedTable.createRecordsAsync(createBatch.slice(0, 50));
        createBatch = createBatch.slice(50);
    }

    function getMonthYear(dateValue) {
        const date = new Date(dateValue);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Add leading zero if needed
        return `${year}-${month}`;
    }

}