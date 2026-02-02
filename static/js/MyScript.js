// ==================== Data Storage Functions ====================

// Format number with commas (like Excel)
function formatNumber(num) {
    const parsed = parseFloat(String(num).replace(/,/g, ''));
    if (isNaN(parsed)) return '0';
    return parsed.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2});
}

// Export Last Order data to Excel
function exportLastOrder() {
    if (typeof XLSX === 'undefined') {
        alert('XLSX library not loaded. Please ensure the CDN is available.');
        return;
    }

    // Get data from current page table only
    const rows = document.querySelectorAll('table tbody tr');
    const exportData = [];
    
    rows.forEach((row) => {
        const num = row.querySelector('.num')?.value || '';
        const sub_m = row.querySelector('.sub_m')?.value || '';
        const name = row.querySelector('.name')?.value || '';
        const final_amount_package = parseFloat(String(row.querySelector('.final_amount_package')?.value || '0').replace(/,/g, '')) || 0;
        const num_pill_sy = parseFloat(String(row.querySelector('.num_pill_sy')?.value || '0').replace(/,/g, '')) || 0;
        const final_amount_pill = parseFloat(String(row.querySelector('.final_amount_pill')?.value || '0').replace(/,/g, '')) || 0;
        const box_num = row.querySelector('.box_num')?.value || '';
        const status_value = row.querySelector('.status_value')?.value || '';
        
        // Add row if it has any data
        if (num || sub_m || name || box_num || status_value) {
            exportData.push({
                no: num,
                substance: sub_m,
                name: name,
                final_amount_package: final_amount_package,
                num_pill_sy: num_pill_sy,
                final_amount_pill: final_amount_pill,
                box_num: box_num,
                status: status_value
            });
        }
    });
    
    if (exportData.length === 0) {
        alert('No data found to export.');
        return;
    }
    
    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportData, { header: ['no', 'substance', 'name', 'final_amount_package', 'num_pill_sy', 'final_amount_pill', 'box_num', 'status'] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Last Order');
    
    // Generate filename with today's date
    const today = new Date();
    const dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    const filename = `Order_${dateStr}.xlsx`;
    
    // Trigger download
    try {
        XLSX.writeFile(wb, filename);
        console.log('Export successful: ' + filename);
    } catch (err) {
        console.error('Export failed', err);
        alert('Export failed: ' + (err && err.message ? err.message : String(err)));
    }
}

// Load Last Order from saved bundle (saved by DeleteOrder)
function loadLastOrderBundle() {
    const lastBundle = JSON.parse(localStorage.getItem('lastOrderBundle')) || null;
    const tableBody = document.querySelector('table tbody');
    if (!tableBody) return; // If not on Last Order page, exit

    const pills = getAllSavedPills();
    const pillsMap = {};
    pills.forEach(pill => {
        pillsMap[pill.sub_d] = pill;
    });

    let processData = [];
    let damasData = [];
    let ordersData = [];
    if (lastBundle) {
        processData = lastBundle.processData || [];
        damasData = lastBundle.damasData || [];
        ordersData = lastBundle.ordersData || [];
    }

    // Create maps for easy lookup
    const damasDataMap = {};
    damasData.forEach(dData => {
        damasDataMap[dData.no] = dData;
    });

    const ordersDataMap = {};
    ordersData.forEach(oData => {
        ordersDataMap[oData.no] = oData;
    });

    tableBody.innerHTML = '';

    if (processData.length > 0) {
        // Load bundled process data into Last Order table
        processData.forEach((pRow) => {
            const damasRow = damasDataMap[pRow.no];
            const orderRow = ordersDataMap[pRow.no];

            if (damasRow && orderRow) {
                const pill = pillsMap[orderRow.sub_o];
                const row = document.createElement('tr');

                row.innerHTML = `
                    <td data-label="No."><input type="number" class="num" value="${pRow.no}" readonly></td>
                    <td data-label="Substance"><input type="text" class="sub_m" value="${orderRow.sub_o}" readonly></td>
                    <td data-label="Name"><input type="text" class="name" value="${pill ? pill.name : ''}" readonly></td>
                    <td data-label="Amt Package"><input type="text" class="final_amount_package" value="${formatNumber(damasRow.final_amount_package || 0)}" readonly></td>
                    <td data-label="Pills"><input type="text" class="num_pill_sy" value="${pill ? formatNumber(pill.num_pill_sy) : 0}" readonly></td>
                    <td data-label="Amt Pill"><input type="text" class="final_amount_pill" value="${formatNumber(damasRow.final_amount_pill || 0)}" readonly></td>
                    <td data-label="Box"><input type="text" class="box_num" value="${pRow.box_num || ''}" readonly></td>
                    <td data-label="Image"><input type="image" class="pill_img" src="${pill ? pill.pill_img_src : ''}" value="" readonly></td>
                    <td data-label="Status"><input type="text" class="status_value" value="${pRow.status || ''}" readonly></td>
                `;
                tableBody.appendChild(row);
                // highlight if urgent
                if (orderRow && orderRow.urgent) {
                    row.classList.add('urgent-row');
                }
            }
        });
    } else {
        // Show empty row if no data
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="No."><input type="text" class="num" readonly></td>
            <td data-label="Substance"><input type="text" class="sub_m" readonly></td>
            <td data-label="Name"><input type="text" class="name" readonly></td>
            <td data-label="Amt Package"><input type="text" class="final_amount_package" readonly></td>
            <td data-label="Pills"><input type="text" class="num_pill_sy" readonly></td>
            <td data-label="Amt Pill"><input type="text" class="final_amount_pill" readonly></td>
            <td data-label="Box"><input type="text" class="box_num" readonly></td>
            <td data-label="Image"><input type="image" class="pill_img" src="" value="" readonly></td>
            <td data-label="Status"><input type="text" class="status_value" readonly></td>
        `;
        tableBody.appendChild(row);
    }

    // (No urgent highlighting on Last Order page)
}

// Restrict input to numbers only (and decimal point)
function restrictToNumbersOnly(element) {
    if (!element) return;
    
    element.addEventListener('input', function() {
        // Allow only digits and decimal point
        this.value = this.value.replace(/[^0-9.]/g, '');
        
        // Prevent multiple decimal points
        const decimalCount = (this.value.match(/\./g) || []).length;
        if (decimalCount > 1) {
            this.value = this.value.substring(0, this.value.lastIndexOf('.')) + 
                        this.value.substring(this.value.lastIndexOf('.') + 1).replace(/\./g, '');
        }
    });
}

// Add formatting event listener to number inputs
function addNumberFormatting(element) {
    if (!element) return;
    
    element.addEventListener('blur', function() {
        if (this.value) {
            this.value = formatNumber(this.value);
        }
    });
    
    element.addEventListener('focus', function() {
        this.value = parseFloat(String(this.value).replace(/,/g, '')) || '';
    });
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('dataTableBody')) {
        loadSavedData();
    }
});

// Load saved data from localStorage
function loadSavedData() {
    const savedData = JSON.parse(localStorage.getItem('pillsData')) || [];
    const tableBody = document.getElementById('dataTableBody');
    
    if (savedData.length > 0) {
        // Remove the empty input row
        tableBody.innerHTML = '';
        
        // Add saved rows
        savedData.forEach((row) => {
            addRowToTable(row);
        });
        
        // Add new empty row for input
        addNewEmptyRow();
    }
}

// Add a new empty row for data input
function addNewRow() {
    addNewEmptyRow();
}

// Create new empty row
function addNewEmptyRow() {
    const tableBody = document.getElementById('dataTableBody');
    const newRow = document.createElement('tr');
    newRow.className = 'input-row';
    newRow.innerHTML = `
        <td data-label="Substance"><input type="text" class="sub_d" placeholder="Enter substance"></td>
        <td data-label="Name"><input type="text" class="name" placeholder="Enter name"></td>
        <td data-label="Company"><input type="text" class="com" placeholder="Enter company"></td>
        <td data-label="Pills BL"><input type="text" class="num_pill_lb" placeholder="0"></td>
        <td data-label="Pills SY"><input type="text" class="num_pill_sy" placeholder="0"></td>
        <td data-label="Price"><input type="text" class="price" placeholder="0"></td>
        <td data-label="Image"><input type="text" class="pill_img_src" placeholder="Image URL"></td>
        <td data-label="Action"><button class="btn btn-sm btn-danger" onclick="deleteRow(this)"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tableBody.appendChild(newRow);
    
    // Add formatting listeners to numeric inputs
    newRow.querySelectorAll('.num_pill_lb, .num_pill_sy, .price').forEach(el => {
        addNumberFormatting(el);
    });
}

// Add row to table from saved data
function addRowToTable(data) {
    const tableBody = document.getElementById('dataTableBody');
    const newRow = document.createElement('tr');
    newRow.className = 'data-row';
    newRow.innerHTML = `
        <td data-label="Substance"><input type="text" class="sub_d" value="${data.sub_d || ''}" placeholder="Enter substance"></td>
        <td data-label="Name"><input type="text" class="name" value="${data.name || ''}" placeholder="Enter name"></td>
        <td data-label="Company"><input type="text" class="com" value="${data.com || ''}" placeholder="Enter company"></td>
        <td data-label="Pills BL"><input type="text" class="num_pill_lb" value="${formatNumber(data.num_pill_lb || 0)}" placeholder="0"></td>
        <td data-label="Pills SY"><input type="text" class="num_pill_sy" value="${formatNumber(data.num_pill_sy || 0)}" placeholder="0"></td>
        <td data-label="Price"><input type="text" class="price" value="${formatNumber(data.price || 0)}" placeholder="0"></td>
        <td data-label="Image"><input type="text" class="pill_img_src" value="${data.pill_img_src || ''}" placeholder="Image URL"></td>
        <td data-label="Action"><button class="btn btn-sm btn-danger" onclick="deleteRow(this)"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tableBody.appendChild(newRow);
    
    // Add formatting listeners to numeric inputs
    newRow.querySelectorAll('.num_pill_lb, .num_pill_sy, .price').forEach(el => {
        addNumberFormatting(el);
    });
}

// Collect and save pill data from table
function collectPillData() {
    const rows = document.querySelectorAll('#dataTableBody tr');
    const pillsData = [];
    
    rows.forEach((row) => {
        const sub_d = row.querySelector('.sub_d')?.value || '';
        const name = row.querySelector('.name')?.value || '';
        const com = row.querySelector('.com')?.value || '';
        const num_pill_lb = parseFloat(String(row.querySelector('.num_pill_lb')?.value || '0').replace(/,/g, ''));
        const num_pill_sy = parseFloat(String(row.querySelector('.num_pill_sy')?.value || '0').replace(/,/g, ''));
        const price = parseFloat(String(row.querySelector('.price')?.value || '0').replace(/,/g, ''));
        const pill_img_src = row.querySelector('.pill_img_src')?.value || '';
        
        // Only save rows that have at least substance name filled
        if (sub_d.trim()) {
            pillsData.push({
                sub_d,
                name,
                com,
                num_pill_lb,
                num_pill_sy,
                price,
                pill_img_src
            });
        }
    });
    
    // Save to localStorage
    localStorage.setItem('pillsData', JSON.stringify(pillsData));
    
    // Show success message
    const message = document.getElementById('saveMessage');
    if (message) {
        message.style.display = 'block';
        setTimeout(() => {
            message.style.display = 'none';
        }, 3000);
    }
    
    console.log('Data saved:', pillsData);
}

// Trigger the hidden file input to import Excel
function importFromExcel() {
    const input = document.getElementById('excelFileInput');
    if (!input) {
        alert('Excel input not found on the page.');
        return;
    }
    input.click();
}

// Process selected Excel file and import rows into pillsData
function processExcelFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
        alert('XLSX library not loaded. Please ensure you have internet connection or include the library.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            const arr = new Uint8Array(data);
            const workbook = XLSX.read(arr, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];

            // Convert to JSON rows (array-of-arrays)
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            if (!rows || rows.length === 0) {
                alert('Excel file is empty.');
                return;
            }

            // Expect header row with keys matching: sub_d,name,com,num_pill_lb,num_pill_sy,price,pill_img_src
            const header = rows[0].map(h => String(h).trim());
            const mapped = [];

            for (let r = 1; r < rows.length; r++) {
                const row = rows[r];
                if (!row || row.length === 0) continue;

                const obj = {};
                header.forEach((h, idx) => {
                    obj[h] = row[idx] !== undefined ? row[idx] : '';
                });

                const sub_d = String(obj.sub_d || '').trim();
                if (!sub_d) continue; // skip rows without primary key

                const num_pill_lb = parseFloat(String(obj.num_pill_lb || '0').replace(/,/g, '')) || 0;
                const num_pill_sy = parseFloat(String(obj.num_pill_sy || '0').replace(/,/g, '')) || 0;
                const price = parseFloat(String(obj.price || '0').replace(/,/g, '')) || 0;

                mapped.push({
                    sub_d,
                    name: String(obj.name || '').trim(),
                    com: String(obj.com || '').trim(),
                    num_pill_lb,
                    num_pill_sy,
                    price,
                    pill_img_src: String(obj.pill_img_src || '').trim()
                });
            }

            // Save to localStorage and reload data view
            localStorage.setItem('pillsData', JSON.stringify(mapped));
            alert('Imported ' + mapped.length + ' rows from Excel.');
            loadSavedData();
        } catch (err) {
            alert('Failed to import Excel file: ' + err.message);
            console.error(err);
        }
    };

    reader.readAsArrayBuffer(file);
}

// Export current data rows (including unsaved inputs) to Excel
function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        alert('XLSX library not loaded. Please ensure the CDN is available.');
        return;
    }

    const rows = document.querySelectorAll('#dataTableBody tr');
    const exportData = [];

    rows.forEach((row) => {
        const sub_d = row.querySelector('.sub_d')?.value || '';
        if (!sub_d || !String(sub_d).trim()) return; // skip empty primary key

        const name = row.querySelector('.name')?.value || '';
        const com = row.querySelector('.com')?.value || '';
        const num_pill_lb = parseFloat(String(row.querySelector('.num_pill_lb')?.value || '0').replace(/,/g, '')) || 0;
        const num_pill_sy = parseFloat(String(row.querySelector('.num_pill_sy')?.value || '0').replace(/,/g, '')) || 0;
        const price = parseFloat(String(row.querySelector('.price')?.value || '0').replace(/,/g, '')) || 0;
        const pill_img_src = row.querySelector('.pill_img_src')?.value || '';

        exportData.push({
            sub_d,
            name,
            com,
            num_pill_lb,
            num_pill_sy,
            price,
            pill_img_src
        });
    });

    if (exportData.length === 0) {
        alert('No data found to export.');
        return;
    }

    // Create worksheet and workbook
    const ws = XLSX.utils.json_to_sheet(exportData, { header: ['sub_d','name','com','num_pill_lb','num_pill_sy','price','pill_img_src'] });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pills');

    // Trigger download
    try {
        XLSX.writeFile(wb, 'pills_export.xlsx');
        alert('Export started: pills_export.xlsx');
    } catch (err) {
        console.error('Export failed', err);
        alert('Export failed: ' + (err && err.message ? err.message : String(err)));
    }
}

// Delete a row from table
function deleteRow(button) {
    const row = button.closest('tr');
    row.remove();
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data?')) {
        localStorage.removeItem('pillsData');
        const tableBody = document.getElementById('dataTableBody');
        tableBody.innerHTML = `
            <tr class="input-row">
                <td><input type="text" class="sub_d" placeholder="Enter substance"></td>
                <td><input type="text" class="name" placeholder="Enter name"></td>
                <td><input type="text" class="com" placeholder="Enter company"></td>
                <td><input type="number" class="num_pill_lb" placeholder="0"></td>
                <td><input type="number" class="num_pill_sy" placeholder="0"></td>
                <td><input type="number" class="price" placeholder="0"></td>
                <td><input type="text" class="pill_img_src" placeholder="Image URL"></td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteRow(this)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    }
}

// Get all saved pills data
function getAllSavedPills() {
    return JSON.parse(localStorage.getItem('pillsData')) || [];
}

// Get pill by substance name (primary key)
function getPillBySubstance(substance) {
    const pills = getAllSavedPills();
    return pills.find(pill => pill.sub_d === substance);
}

// ==================== Order Functions ====================

// Save order data to localStorage
function collectOrderData() {
    const rows = document.querySelectorAll('#orderTableBody tr');
    const ordersData = [];
    
    rows.forEach((row, index) => {
        const sub_o = row.querySelector('.sub_o')?.value || '';
        const pack_c = parseFloat(String(row.querySelector('.pack_c')?.value || '0').replace(/,/g, ''));
        const pack_order = parseFloat(String(row.querySelector('.pack_order')?.value || '0').replace(/,/g, ''));
        const pack_r_order = parseFloat(String(row.querySelector('.pack_r_order')?.value || '0').replace(/,/g, ''));
        const pack_f = parseFloat(String(row.querySelector('.pack_f')?.value || '0').replace(/,/g, ''));
        const pill_order = parseFloat(String(row.querySelector('.pill_order')?.value || '0').replace(/,/g, ''));
        const pill_r_order = parseFloat(String(row.querySelector('.pill_r_order')?.value || '0').replace(/,/g, ''));
        const urgent = row.querySelector('.urgent')?.checked || false;
        
        // Only save rows that have substance
        if (sub_o.trim()) {
            ordersData.push({
                no: index + 1,  // Add row number as primary key
                sub_o,
                pack_c,
                pack_order,
                pack_r_order,
                pack_f,
                pill_order,
                pill_r_order
                ,
                urgent
            });
        }
    });
    
    // Save to localStorage
    localStorage.setItem('ordersData', JSON.stringify(ordersData));
    
    console.log('Order data saved:', ordersData);
}

// Load order data from localStorage and display
function loadOrderDataFromStorage() {
    const ordersData = JSON.parse(localStorage.getItem('ordersData')) || [];
    const tableBody = document.getElementById('orderTableBody');
    
    const pills = getAllSavedPills();
    const pillsMap = {};
    pills.forEach(pill => {
        pillsMap[pill.sub_d] = pill;
    });
    
    tableBody.innerHTML = '';
    
    if (ordersData.length > 0) {
        // Load saved orders
        ordersData.forEach((order, index) => {
            const pill = pillsMap[order.sub_o];
            const row = document.createElement('tr');
            
            // Create datalist for substance options
            const dataListId = 'substanceList' + Date.now() + index;
            let substanceOptions = '';
            pills.forEach(p => {
                substanceOptions += `<option value="${p.sub_d}">`;
            });
            
            row.innerHTML = `
                <td><input type="text" class="num" value="${order.no}" readonly></td>
                <td>
                    <input type="text" class="sub_o form-control" list="${dataListId}" value="${order.sub_o}" placeholder="Type or select..." onchange="onSubstanceChange(this)" onblur="onSubstanceChange(this)">
                    <datalist id="${dataListId}">
                        ${substanceOptions}
                    </datalist>
                </td>
                <td><input type="text" class="name" value="${pill ? pill.name : ''}" readonly></td>
                <td><input type="text" class="num_pill_lb" value="${pill ? formatNumber(pill.num_pill_lb) : 0}" readonly></td>
                <td><input type="text" class="pack_c" value="${formatNumber(order.pack_c)}" onchange="calculatePackValues(this)"></td>
                <td><input type="text" class="pack_order" value="${formatNumber(order.pack_order)}" onchange="calculatePackValues(this)"></td>
                <td><input type="text" class="pack_r_order" value="${formatNumber(order.pack_r_order)}" onchange="calculatePackValues(this)"></td>
                <td><input type="text" class="pack_f" value="${formatNumber(order.pack_f)}" readonly></td>
                <td><input type="text" class="pill_order" value="${formatNumber(order.pill_order)}" readonly></td>
                <td><input type="text" class="pill_r_order" value="${formatNumber(order.pill_r_order)}" readonly></td>
                <td><input type="image" class="pill_img" src="${pill ? pill.pill_img_src : ''}"value="" readonly></td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteOrderRow(this)"><i class="fa-solid fa-trash"></i></button></td>
                <td class="text-center"><input type="checkbox" class="urgent" ${order.urgent ? 'checked' : ''}></td>
            `;
            tableBody.appendChild(row);
            
            // Add number restriction and formatting to the input fields
            row.querySelectorAll('.pack_c, .pack_order, .pack_r_order').forEach(el => {
                restrictToNumbersOnly(el);  // تقييد الإدخال بالأرقام فقط
                addNumberFormatting(el);    // إضافة التنسيق عند فقدان التركيز
            });
            // Attach urgent checkbox listener and mark urgent if saved
            const urgentInput = row.querySelector('.urgent');
            if (urgentInput) {
                urgentInput.addEventListener('change', function() {
                    handleUrgentToggle(row, urgentInput.checked);
                });
                if (order.urgent) {
                    row.classList.add('urgent-row');
                }
            }
        });
        // group urgent rows to top preserving order
        reorderUrgentRows(tableBody);
    } else {
        // If no saved data, show empty row
        addNewOrderRow(tableBody, pills, 1);
    }
}

// Calculate pack and pill values
function calculatePackValues(input) {
    const row = input.closest('tr');
    const pack_c = parseFloat(row.querySelector('.pack_c').value.replace(/,/g, '')) || 0;
    const pack_order = parseFloat(row.querySelector('.pack_order').value.replace(/,/g, '')) || 0;
    const pack_r_order = parseFloat(row.querySelector('.pack_r_order').value.replace(/,/g, '')) || 0;
    
    // Calculate final balance (pack_c + pack_order)
    const pack_f = pack_c + pack_order;
    row.querySelector('.pack_f').value = formatNumber(pack_f);
    
    // Calculate pill values (assuming equal distribution)
    const num_pill_lb = parseFloat(row.querySelector('.num_pill_lb').value.replace(/,/g, '')) || 0;
    const pill_order = pack_order * num_pill_lb;
    const pill_r_order = pack_r_order * num_pill_lb;
    
    row.querySelector('.pill_order').value = formatNumber(pill_order);
    row.querySelector('.pill_r_order').value = formatNumber(pill_r_order);
}

// Move urgent rows to top (preserve their relative order)
function reorderUrgentRows(tableBody) {
    if (!tableBody) return;
    const urgentRows = Array.from(tableBody.querySelectorAll('tr.urgent-row'));
    if (urgentRows.length === 0) return;
    const frag = document.createDocumentFragment();
    urgentRows.forEach(r => frag.appendChild(r));
    tableBody.insertBefore(frag, tableBody.firstChild);
}

// Handle urgent checkbox toggle: highlight and reorder row, then save
function handleUrgentToggle(row, checked) {
    const tableBody = row && row.parentElement ? row.parentElement : null;
    if (!tableBody) return;
    if (checked) {
        row.classList.add('urgent-row');
        // place the row among urgent rows at top (after existing urgent rows)
        const firstNonUrgent = tableBody.querySelector('tr:not(.urgent-row)');
        if (firstNonUrgent) {
            tableBody.insertBefore(row, firstNonUrgent);
        } else {
            tableBody.appendChild(row);
        }
    } else {
        row.classList.remove('urgent-row');
        // move to end
        tableBody.appendChild(row);
    }

    // Persist the change
    collectOrderData();
}

// Add a new empty order row
function addNewOrderRow(tableBody, pills, rowNumber) {
    const row = document.createElement('tr');
    
    // Create datalist for substance options
    const dataListId = 'substanceList' + Date.now();
    let substanceOptions = '';
    pills.forEach(pill => {
        substanceOptions += `<option value="${pill.sub_d}">`;
    });
    
    row.innerHTML = `
        <td data-label="No."><input type="text" class="num" value="${rowNumber}" readonly></td>
        <td data-label="Substance">
            <input type="text" class="sub_o form-control" list="${dataListId}" placeholder="Type or select..." oninput="onSubstanceChange(this)">
            <datalist id="${dataListId}">
                ${substanceOptions}
            </datalist>
        </td>
        <td data-label="Name"><input type="text" class="name" readonly></td>
        <td data-label="Pills"><input type="text" class="num_pill_lb" readonly></td>
        <td data-label="Balance"><input type="text" class="pack_c" value="0" onchange="calculatePackValues(this)"></td>
        <td data-label="Order Qty"><input type="text" class="pack_order" value="" onchange="calculatePackValues(this)"></td>
        <td data-label="Real Order"><input type="text" class="pack_r_order" value="" onchange="calculatePackValues(this)"></td>
        <td data-label="Final"><input type="text" class="pack_f" value="" readonly></td>
        <td data-label="Pill Qty"><input type="text" class="pill_order" value="" readonly></td>
        <td data-label="Pill Real"><input type="text" class="pill_r_order" value="" readonly></td>
        <td data-label="Image"><input type="image" class="pill_img" value="" readonly></td>
        <td data-label="Action"><button class="btn btn-sm btn-danger" onclick="deleteOrderRow(this)"><i class="fa-solid fa-trash"></i></button></td>
        <td data-label="Urgent" class="text-center"><input type="checkbox" class="urgent"></td>
    `;
    tableBody.appendChild(row);
    
    // Add formatting listeners and number restriction
    row.querySelectorAll('.pack_c, .pack_order, .pack_r_order').forEach(el => {
        restrictToNumbersOnly(el);  // تقييد الإدخال بالأرقام فقط
        addNumberFormatting(el);    // إضافة التنسيق عند فقدان التركيز
    });
    // attach urgent listener
    const urgentInput = row.querySelector('.urgent');
    if (urgentInput) {
        urgentInput.addEventListener('change', function() {
            handleUrgentToggle(row, urgentInput.checked);
        });
    }
}

// Handle substance change event
function onSubstanceChange(selectElement) {
    const row = selectElement.closest('tr');
    const substance = selectElement.value;
    
    if (!substance) {
        // Clear fields if no substance selected
        row.querySelector('.name').value = '';
        row.querySelector('.num_pill_lb').value = '';
        row.querySelector('.pill_img').src = '';
        return;
    }
    
    // Get pill data
    const pill = getPillBySubstance(substance);
    
    if (pill) {
        // Fill other fields automatically
        row.querySelector('.name').value = pill.name;
        row.querySelector('.num_pill_lb').value = pill.num_pill_lb;
        row.querySelector('.pill_img').src = pill.pill_img_src;
    }
    
    // Check if there's already an empty row at the end
    const tableBody = document.getElementById('orderTableBody');
    const rows = tableBody.querySelectorAll('tr');
    let hasEmptyRow = false;
    
    // Count empty rows (rows with no substance)
    for (let i = rows.length - 1; i >= 0; i--) {
        const rowSubstance = rows[i].querySelector('.sub_o')?.value || '';
        if (!rowSubstance.trim()) {
            hasEmptyRow = true;
            break;
        }
    }
    
    // Only add a new row if there's no empty row already
    if (!hasEmptyRow) {
        const pills = getAllSavedPills();
        const rowNumber = rows.length + 1;
        addNewOrderRow(tableBody, pills, rowNumber);
    }
}

// Add a new empty order row (wrapper for UI)
function addOrderRow() {
    const tableBody = document.getElementById('orderTableBody');
    const pills = getAllSavedPills();
    const rowNumber = tableBody.querySelectorAll('tr').length + 1;
    
    addNewOrderRow(tableBody, pills, rowNumber);
}

// Delete an order row
function deleteOrderRow(button) {
    const tableBody = document.getElementById('orderTableBody');
    const rows = tableBody.querySelectorAll('tr');
    const row = button.closest('tr');
    
    // If it's the last (only) row, clear its data instead of deleting
    if (rows.length === 1) {
        row.querySelector('.sub_o').value = '';
        row.querySelector('.name').value = '';
        row.querySelector('.num_pill_lb').value = '';
        row.querySelector('.pack_c').value = '0';
        row.querySelector('.pack_order').value = '0';
        row.querySelector('.pack_r_order').value = '0';
        row.querySelector('.pack_f').value = '0';
        row.querySelector('.pill_order').value = '0';
        row.querySelector('.pill_r_order').value = '0';
        row.querySelector('.pill_img').src = '';
        const urgentInput = row.querySelector('.urgent');
        if (urgentInput) urgentInput.checked = false;
        return;
    }
    
    row.remove();
    
    // Update row numbers
    const updatedRows = tableBody.querySelectorAll('tr');
    updatedRows.forEach((r, index) => {
        r.querySelector('.num').value = index + 1;
    });
}

function SendOrdertoDamas() {
    // Before collecting new order data, read existing downstream data
    const oldDamasData = JSON.parse(localStorage.getItem('damasData')) || [];
    const oldProcessData = JSON.parse(localStorage.getItem('processData')) || [];

    // Build a map from old damas no -> substance for remapping processData
    const oldNoToSub = {};
    oldDamasData.forEach(d => {
        if (d && d.no) oldNoToSub[String(d.no)] = d.sub_damas;
    });

    // Collect and save current order data (this will renumber rows and persist ordersData)
    collectOrderData();

    // Get the newly saved orders and build a lookup of remaining substances -> newNo
    const ordersData = JSON.parse(localStorage.getItem('ordersData')) || [];
    const remainingSubs = new Set();
    const subToNewNo = {};
    ordersData.forEach(o => {
        if (o.sub_o) {
            remainingSubs.add(o.sub_o);
            subToNewNo[o.sub_o] = String(o.no);
        }
    });

    // Filter and remap damasData: keep only rows whose substance still exists in orders
    const newDamasData = [];
    oldDamasData.forEach(d => {
        if (!d) return;
        // If this damas row's substance is present in remaining orders, keep and update its no
        if (remainingSubs.has(d.sub_damas)) {
            const updatedNo = subToNewNo[d.sub_damas] || d.no;
            newDamasData.push(Object.assign({}, d, { no: String(updatedNo) }));
        }
    });

    // Filter and remap processData: use oldNo->sub mapping to find corresponding substance,
    // then include only if that substance remains, updating the 'no' to the new order number.
    const newProcessData = [];
    oldProcessData.forEach(p => {
        if (!p) return;
        const oldNo = String(p.no);
        const sub = oldNoToSub[oldNo];
        if (sub && remainingSubs.has(sub)) {
            const updatedNo = subToNewNo[sub] || p.no;
            newProcessData.push(Object.assign({}, p, { no: String(updatedNo) }));
        }
    });

    // Save filtered/updated downstream data back to localStorage (do NOT touch lastOrderBundle)
    localStorage.setItem('damasData', JSON.stringify(newDamasData));
    localStorage.setItem('processData', JSON.stringify(newProcessData));

    // Show success message
    alert('Order data saved successfully!');
    console.log('Order sent to Damas');
}

// Load Damas data from saved orders
function loadDamasDataFromStorage() {
    const ordersData = JSON.parse(localStorage.getItem('ordersData')) || [];
    const damasData = JSON.parse(localStorage.getItem('damasData')) || [];
    const tableBody = document.querySelector('#damasTableBody');
    
    if (!tableBody) return; // If not on Damas page, exit
    
    const pills = getAllSavedPills();
    const pillsMap = {};
    pills.forEach(pill => {
        pillsMap[pill.sub_d] = pill;
    });
    
    // Create a map of Damas data by row number for easy lookup
    const damasDataMap = {};
    damasData.forEach(dData => {
        damasDataMap[dData.no] = dData;
    });
    
    tableBody.innerHTML = '';
    
    if (ordersData.length > 0) {
        // Load orders into Damas table
        ordersData.forEach((order) => {
            const pill = pillsMap[order.sub_o];
            const row = document.createElement('tr');
            
            // Get saved Damas data for this row
            const savedDamasRow = damasDataMap[order.no];
            const finall_order = savedDamasRow?.finall_order || '';
            const bonus = savedDamasRow?.bonus || '0';
            
            const placeholderValue = pill ? Math.ceil(order.pill_order / pill.num_pill_sy) : '';
            
            row.innerHTML = `
                <td data-label="No."><input type="text" class="num" value="${order.no}" readonly></td>
                <td data-label="Substance"><input type="text" class="sub_damas" value="${order.sub_o}" readonly></td>
                <td data-label="Name"><input type="text" class="name" value="${pill ? pill.name : ''}" readonly></td>
                <td data-label="Company"><input type="text" class="com" value="${pill ? pill.com : ''}" readonly></td>
                <td data-label="Pill Order"><input type="text" class="pill_order" value="${formatNumber(order.pill_order)}" readonly></td>
                <td data-label="Final Order"><input type="text" class="finall_order" value="${finall_order ? formatNumber(finall_order) : ''}" placeholder="${placeholderValue}" onchange="calculateDamasValues(this)"></td>
                <td data-label="Price"><input type="text" class="price" value="${pill ? formatNumber(pill.price) : 0}" readonly></td>
                <td data-label="Total"><input type="text" class="t_price" readonly></td>
                <td data-label="Bonus"><input type="text" class="bonus" value="${bonus ? formatNumber(bonus) : '0'}" onchange="calculateDamasValues(this)"></td>
                <td data-label="Pills SY"><input type="text" class="num_pill_sy" value="${pill ? formatNumber(pill.num_pill_sy) : 0}" readonly></td>
                <td data-label="Amt Package"><input type="text" class="final_amount_package" readonly></td>
                <td data-label="Amt Pill"><input type="text" class="final_amount_pill" readonly></td>
                <td data-label="Image"><input type="image" class="pill_img" src="${pill ? pill.pill_img_src : ''}" value="" readonly></td>
            `;
            tableBody.appendChild(row);
            
            // Add formatting listeners
            row.querySelectorAll('.finall_order, .bonus').forEach(el => {
                addNumberFormatting(el);
            });
            
            // Trigger calculation to populate calculated fields
            const finallOrderInput = row.querySelector('.finall_order');
            if (finallOrderInput.value) {
                calculateDamasValues(finallOrderInput);
            }
            // highlight urgent rows if this order is urgent
            if (order && order.urgent) {
                row.classList.add('urgent-row');
            }
        });
    } else {
        // Show empty row if no data
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="No."><input type="text" class="num" readonly></td>
            <td data-label="Substance"><input type="text" class="sub_damas" readonly></td>
            <td data-label="Name"><input type="text" class="name" readonly></td>
            <td data-label="Company"><input type="text" class="com" readonly></td>
            <td data-label="Pill Order"><input type="text" class="pill_order" readonly></td>
            <td data-label="Final Order"><input type="text" class="finall_order" readonly></td>
            <td data-label="Price"><input type="text" class="price" readonly></td>
            <td data-label="Total"><input type="text" class="t_price" readonly></td>
            <td data-label="Bonus"><input type="text" class="bonus"></td>
            <td data-label="Pills SY"><input type="text" class="num_pill_sy" readonly></td>
            <td data-label="Amt Package"><input type="text" class="final_amount_package"></td>
            <td data-label="Amt Pill"><input type="text" class="final_amount_pill" readonly></td>
            <td data-label="Image"><input type="image" class="pill_img" src="" value="" readonly></td>
        `;
        tableBody.appendChild(row);
    }
}

// Clear all order data
function clearAllOrderData() {
    if (confirm('Are you sure you want to clear all order data?')) {
        localStorage.removeItem('ordersData');
        const tableBody = document.getElementById('orderTableBody');
        tableBody.innerHTML = '';
        
        // Load empty row
        const pills = getAllSavedPills();
        addNewOrderRow(tableBody, pills, 1);
        
        alert('All data cleared!');
    }
}

function ConfirmOrder() {
    // Save all Damas data
    saveDamasChanges();
    
    // Show success message
    alert('Order confirmed and saved successfully!');
    console.log('Confirm order - data saved');
}

// Save Damas changes to localStorage
function saveDamasChanges() {
    const rows = document.querySelectorAll('#damasTableBody tr');
    const damasData = [];
    
    rows.forEach((row) => {
        const num = row.querySelector('.num')?.value || '';
        const sub_damas = row.querySelector('.sub_damas')?.value || '';
        const name = row.querySelector('.name')?.value || '';
        const com = row.querySelector('.com')?.value || '';
        const pill_order = parseFloat(String(row.querySelector('.pill_order')?.value || '0').replace(/,/g, ''));
        const finall_order = parseFloat(String(row.querySelector('.finall_order')?.value || '0').replace(/,/g, ''));
        const price = parseFloat(String(row.querySelector('.price')?.value || '0').replace(/,/g, ''));
        const t_price = parseFloat(String(row.querySelector('.t_price')?.value || '0').replace(/,/g, ''));
        const bonus = parseFloat(String(row.querySelector('.bonus')?.value || '0').replace(/,/g, ''));
        const num_pill_sy = parseFloat(String(row.querySelector('.num_pill_sy')?.value || '0').replace(/,/g, ''));
        const final_amount_package = parseFloat(String(row.querySelector('.final_amount_package')?.value || '0').replace(/,/g, ''));
        const final_amount_pill = parseFloat(String(row.querySelector('.final_amount_pill')?.value || '0').replace(/,/g, ''));
        
        if (num) {
            damasData.push({
                no: num,
                sub_damas,
                name,
                com,
                pill_order,
                finall_order,
                price,
                t_price,
                bonus,
                num_pill_sy,
                final_amount_package,
                final_amount_pill
            });
        }
    });
    
    // Save to localStorage
    localStorage.setItem('damasData', JSON.stringify(damasData));
    console.log('Damas data saved:', damasData);
}

// Calculate Damas values
function calculateDamasValues(input) {
    const row = input.closest('tr');
    const finall_order = parseFloat(row.querySelector('.finall_order').value.replace(/,/g, '')) || 0;
    const price = parseFloat(row.querySelector('.price').value.replace(/,/g, '')) || 0;
    const bonus = parseFloat(row.querySelector('.bonus').value.replace(/,/g, '')) || 0;
    const num_pill_sy = parseFloat(row.querySelector('.num_pill_sy').value.replace(/,/g, '')) || 0;
    
    // Total Price = Finall Order × Price
    const t_price = finall_order * price;
    row.querySelector('.t_price').value = formatNumber(t_price);
    
    // Final Amount Per Package = Finall Order + Bonus
    const final_amount_package = finall_order + bonus;
    row.querySelector('.final_amount_package').value = formatNumber(final_amount_package);
    
    // Final Amount Per Pill = Final Amount Per Package × Num of Pills
    const final_amount_pill = final_amount_package * num_pill_sy;
    row.querySelector('.final_amount_pill').value = formatNumber(final_amount_pill);
    
    // Save changes
    saveDamasChanges();
}

function updateorderstatus() {
    // Save process data
    saveProcessData();
    
    // Show success message
    alert('Order status updated successfully!');
    console.log('Order status updated');
}

// Delete all process data and move it to Last Order bundle
function DeleteOrder() {
    if (!confirm('Move all process data to Last Order and delete from previous pages?')) return;

    const processData = JSON.parse(localStorage.getItem('processData')) || [];
    if (processData.length === 0) {
        alert('No process data to move.');
        return;
    }

    const damasData = JSON.parse(localStorage.getItem('damasData')) || [];
    const ordersData = JSON.parse(localStorage.getItem('ordersData')) || [];

    const lastOrderBundle = {
        processData,
        damasData,
        ordersData
    };

    // Save bundle for Last Order page
    localStorage.setItem('lastOrderBundle', JSON.stringify(lastOrderBundle));

    // Remove from previous storage so other pages become empty
    localStorage.removeItem('processData');
    localStorage.removeItem('damasData');
    localStorage.removeItem('ordersData');

    alert('All process data moved to Last Order and cleared from previous pages.');
    // Refresh the current page so the UI reflects cleared data
    window.location.reload();
}

// Load Process data from Damas
function loadProcessDataFromDamas() {
    const damasData = JSON.parse(localStorage.getItem('damasData')) || [];
    const ordersData = JSON.parse(localStorage.getItem('ordersData')) || [];
    const processData = JSON.parse(localStorage.getItem('processData')) || [];
    const tableBody = document.querySelector('table tbody');
    
    if (!tableBody) return; // If not on Process page, exit
    
    const pills = getAllSavedPills();
    const pillsMap = {};
    pills.forEach(pill => {
        pillsMap[pill.sub_d] = pill;
    });
    
    // Create maps for easy lookup
    const damasDataMap = {};
    damasData.forEach(dData => {
        damasDataMap[dData.no] = dData;
    });
    
    const ordersDataMap = {};
    ordersData.forEach(oData => {
        ordersDataMap[oData.no] = oData;
    });
    
    const processDataMap = {};
    processData.forEach(pData => {
        processDataMap[pData.no] = pData;
    });
    
    tableBody.innerHTML = '';
    
    if (damasData.length > 0) {
        // Load Damas data into Process table
        damasData.forEach((dRow) => {
            const orderRow = ordersDataMap[dRow.no];
            const savedProcessRow = processDataMap[dRow.no];
            
            if (orderRow) {
                const pill = pillsMap[orderRow.sub_o];
                const row = document.createElement('tr');
                
                // Get saved process data
                const box_num = savedProcessRow?.box_num || '';
                const status = savedProcessRow?.status || '';
                
                row.innerHTML = `
                    <td><input type="text" class="num" value="${dRow.no}" readonly></td>
                    <td><input type="text" class="sub_p" value="${orderRow.sub_o}" readonly></td>
                    <td><input type="text" class="name" value="${pill ? pill.name : ''}" readonly></td>
                    <td><input type="text" class="final_amount_package" value="${formatNumber(dRow.final_amount_package || 0)}" readonly></td>
                    <td><input type="text" class="num_pill_sy" value="${pill ? formatNumber(pill.num_pill_sy) : 0}" readonly></td>
                    <td><input type="text" class="final_amount_pill" value="${formatNumber(dRow.final_amount_pill || 0)}" readonly></td>
                    <td><input type="text" class="box_num" value="${box_num}" onchange="saveProcessData()"></td>
                    <td><input type="image" class="pill_img" src="${pill ? pill.pill_img_src : ''}" value="" readonly></td>
                    <td><input type="radio" name="status_${dRow.no}" class="status_ordered" value="Ordered" ${status === 'Ordered' ? 'checked' : ''} onchange="saveProcessData()"></td>
                    <td><input type="radio" name="status_${dRow.no}" class="status_prepar" value="Being prepared" ${status === 'Being prepared' ? 'checked' : ''} onchange="saveProcessData()"></td>
                    <td><input type="radio" name="status_${dRow.no}" class="status_out" value="Out for Delivery" ${status === 'Out for Delivery' ? 'checked' : ''} onchange="saveProcessData()"></td>
                    <td><input type="radio" name="status_${dRow.no}" class="status_transit" value="In Transit" ${status === 'In Transit' ? 'checked' : ''} onchange="saveProcessData()"></td>
                `;
                tableBody.appendChild(row);
                // highlight if urgent
                if (orderRow && orderRow.urgent) {
                    row.classList.add('urgent-row');
                }
            }
        });
    } else {
        // Show empty row if no data
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="text" class="num" readonly></td>
            <td><input type="text" class="sub_p" readonly></td>
            <td><input type="text" class="name" readonly></td>
            <td><input type="text" class="final_amount_package" readonly></td>
            <td><input type="text" class="num_pill_sy" readonly></td>
            <td><input type="text" class="final_amount_pill" readonly></td>
            <td><input type="text" class="box_num"></td>
            <td><input type="image" class="pill_img" src="" value="" readonly></td>
            <td><input type="radio" name="status" class="status_ordered" value="Ordered"></td>
            <td><input type="radio" name="status" class="status_prepar" value="Being prepared"></td>
            <td><input type="radio" name="status" class="status_out" value="Out for Delivery"></td>
            <td><input type="radio" name="status" class="status_transit" value="In Transit"></td>
        `;
        tableBody.appendChild(row);
    }
}

// Save Process data to localStorage
function saveProcessData() {
    const rows = document.querySelectorAll('table tbody tr');
    const processData = [];
    
    rows.forEach((row) => {
        const num = row.querySelector('.num')?.value || '';
        const box_num = row.querySelector('.box_num')?.value || '';
        const statusRadios = row.querySelectorAll('input[type="radio"]:checked');
        let status = '';
        
        if (statusRadios.length > 0) {
            status = statusRadios[0].value;
        }
        
        if (num) {
            processData.push({
                no: num,
                box_num,
                status
            });
        }
    });
    
    // Save to localStorage
    localStorage.setItem('processData', JSON.stringify(processData));
    console.log('Process data saved:', processData);
}

// Load Cost data from Damas and Process
function loadCostDataFromProcess() {
    const damasData = JSON.parse(localStorage.getItem('damasData')) || [];
    const ordersData = JSON.parse(localStorage.getItem('ordersData')) || [];
    const tableBody = document.querySelector('table tbody');
    const costInput = document.querySelector('.f_cost');
    
    if (!tableBody) return; // If not on Cost page, exit
    
    const pills = getAllSavedPills();
    const pillsMap = {};
    pills.forEach(pill => {
        pillsMap[pill.sub_d] = pill;
    });
    
    // Create maps for easy lookup
    const damasDataMap = {};
    damasData.forEach(dData => {
        damasDataMap[dData.no] = dData;
    });
    
    const ordersDataMap = {};
    ordersData.forEach(oData => {
        ordersDataMap[oData.no] = oData;
    });
    
    tableBody.innerHTML = '';
    let totalCost = 0;
    
    if (damasData.length > 0) {
        // Load Damas data into Cost table
        damasData.forEach((dRow) => {
            const orderRow = ordersDataMap[dRow.no];
            
            if (orderRow) {
                const pill = pillsMap[orderRow.sub_o];
                const row = document.createElement('tr');
                
                const final_amount_package = parseFloat(dRow.final_amount_package) || 0;
                const bonus = parseFloat(dRow.bonus) || 0;
                const price = parseFloat(pill?.price) || 0;
                const t_price = parseFloat(dRow.t_price) || 0; // Use t_price from Damas
                
                // Calculate Bonus Percentage = (Bonus / (Final Amount Package - Bonus)) * 100
                const baseAmount = final_amount_package - bonus;
                const bonus_percentage = baseAmount > 0 ? (bonus / baseAmount * 100) : 0;
                
                totalCost += t_price;
                
                row.innerHTML = `
                    <td><input type="number" class="num" value="${dRow.no}" readonly></td>
                    <td><input type="text" class="sub_c" value="${orderRow.sub_o}" readonly></td>
                    <td><input type="text" class="name" value="${pill ? pill.name : ''}" readonly></td>
                    <td><input type="text" class="com" value="${pill ? pill.com : ''}" readonly></td>
                    <td><input type="text" class="final_amount_package" value="${formatNumber(final_amount_package)}" readonly></td>
                    <td><input type="text" class="bonus" value="${formatNumber(bonus)}" readonly></td>
                    <td><input type="text" class="bonus_percentage" value="${formatNumber(bonus_percentage)}%" readonly></td>
                    <td><input type="text" class="price" value="${formatNumber(price)}" readonly></td>
                    <td><input type="text" class="t_price" value="${formatNumber(t_price)}" readonly></td>
                `;
                tableBody.appendChild(row);
                // highlight if urgent
                if (orderRow && orderRow.urgent) {
                    row.classList.add('urgent-row');
                }
            }
        });
        
        // Update final cost
        if (costInput) {
            costInput.value = formatNumber(totalCost);
        }
    } else {
        // Show empty row if no data
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="number" class="num" readonly></td>
            <td><input type="text" class="sub_c" readonly></td>
            <td><input type="text" class="name" readonly></td>
            <td><input type="text" class="com" readonly></td>
            <td><input type="number" class="final_amount_package" readonly></td>
            <td><input type="number" class="bonus" readonly></td>
            <td><input type="text" class="bonus_percentage" placeholder="0%" readonly></td>
            <td><input type="number" class="price" readonly></td>
            <td><input type="number" class="t_price" readonly></td>
        `;
        tableBody.appendChild(row);
        
        if (costInput) {
            costInput.value = formatNumber(0);
        }
    }
}

// Load Management data from Process
function loadManagementDataFromProcess() {
    const processData = JSON.parse(localStorage.getItem('processData')) || [];
    const damasData = JSON.parse(localStorage.getItem('damasData')) || [];
    const ordersData = JSON.parse(localStorage.getItem('ordersData')) || [];
    const tableBody = document.querySelector('table tbody');
    
    if (!tableBody) return; // If not on Management page, exit
    
    const pills = getAllSavedPills();
    const pillsMap = {};
    pills.forEach(pill => {
        pillsMap[pill.sub_d] = pill;
    });
    
    // Create maps for easy lookup
    const damasDataMap = {};
    damasData.forEach(dData => {
        damasDataMap[dData.no] = dData;
    });
    
    const ordersDataMap = {};
    ordersData.forEach(oData => {
        ordersDataMap[oData.no] = oData;
    });
    
    const processDataMap = {};
    processData.forEach(pData => {
        processDataMap[pData.no] = pData;
    });
    
    tableBody.innerHTML = '';
    
    if (processData.length > 0) {
        // Load Process data into Management table
        processData.forEach((pRow) => {
            const damasRow = damasDataMap[pRow.no];
            const orderRow = ordersDataMap[pRow.no];
            
            if (damasRow && orderRow) {
                const pill = pillsMap[orderRow.sub_o];
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td data-label="No."><input type="number" class="num" value="${pRow.no}" readonly></td>
                    <td data-label="Substance"><input type="text" class="sub_m" value="${orderRow.sub_o}" readonly></td>
                    <td data-label="Name"><input type="text" class="name" value="${pill ? pill.name : ''}" readonly></td>
                    <td data-label="Amt Package"><input type="text" class="final_amount_package" value="${formatNumber(damasRow.final_amount_package || 0)}" readonly></td>
                    <td data-label="Pills"><input type="text" class="num_pill_sy" value="${pill ? formatNumber(pill.num_pill_sy) : 0}" readonly></td>
                    <td data-label="Amt Pill"><input type="text" class="final_amount_pill" value="${formatNumber(damasRow.final_amount_pill || 0)}" readonly></td>
                    <td data-label="Box"><input type="text" class="box_num" value="${pRow.box_num || ''}" readonly></td>
                    <td data-label="Image"><input type="image" class="pill_img" src="${pill ? pill.pill_img_src : ''}" value="" readonly></td>
                    <td data-label="Status"><input type="text" class="status_value" value="${pRow.status || ''}" readonly></td>
                `;
                tableBody.appendChild(row);
                // highlight if urgent
                if (orderRow && orderRow.urgent) {
                    row.classList.add('urgent-row');
                }
            }
        });
    } else {
        // Show empty row if no data
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="No."><input type="number" class="num" readonly></td>
            <td data-label="Substance"><input type="text" class="sub_m" readonly></td>
            <td data-label="Name"><input type="text" class="name" readonly></td>
            <td data-label="Amt Package"><input type="number" class="final_amount_package" readonly></td>
            <td data-label="Pills"><input type="number" class="num_pill_sy" readonly></td>
            <td data-label="Amt Pill"><input type="number" class="final_amount_pill" readonly></td>
            <td data-label="Box"><input type="text" class="box_num" readonly></td>
            <td data-label="Image"><input type="image" class="pill_img" src="" value="" readonly></td>
            <td data-label="Status"><input type="text" class="status_value" readonly></td>
        `;
        tableBody.appendChild(row);
    }
}
