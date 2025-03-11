class LoanUI {
    constructor(calculator, charts) {
        this.calculator = calculator;
        this.charts = charts;
        this.initializeDates();
    }

    initializeDates() {
        this.setDefaultStartDate();
        this.setDefaultEarlyPaymentDate();
    }

    setDefaultStartDate() {
        const today = new Date();
        const firstDayNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const dateString = firstDayNextMonth.toISOString().split('T')[0];
        document.getElementById('startDate').value = dateString;
    }

    setDefaultEarlyPaymentDate() {
        const today = new Date();
        const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 1);
        const dateString = threeMonthsFromNow.toISOString().split('T')[0];
        document.getElementById('earlyPaymentDate').value = dateString;
    }

    generateSchedule() {
        const principal = parseFloat(document.getElementById('principal').value);
        const annualRate = parseFloat(document.getElementById('annualRate').value);
        const months = parseInt(document.getElementById('months').value);
        const startDate = new Date(document.getElementById('startDate').value);
        const paymentDay = parseInt(document.getElementById('paymentDay').value);
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;

        const result = this.calculator.calculateLoanSchedule(principal, annualRate, months, startDate, paymentDay, paymentType);
        const schedule = result.schedule;
        
        this.displaySummary(result, schedule);
        this.displayScheduleTable(schedule, principal);
        
        this.charts.generateMonthlyChart(schedule);
        this.charts.generateCumulativeChart(schedule);
    }

    displaySummary(result, schedule) {
        document.getElementById('summary').style.display = 'block';
        document.getElementById('totalCost').textContent = this.calculator.formatCurrency(result.totals.paymentsCents / 100) + ' zł';
        document.getElementById('totalInterest').textContent = this.calculator.formatCurrency(result.totals.interestCents / 100) + ' zł';
        document.getElementById('regularPayment').textContent = schedule[1].monthlyPayment + ' zł';
        document.getElementById('firstPayment').textContent = schedule[0].monthlyPayment + ' zł';
        document.getElementById('lastPayment').textContent = schedule[schedule.length - 1].monthlyPayment + ' zł';
    }

    displayScheduleTable(schedule, principal) {
        let html = this.generateTableHeader();
        const { totalMonthlyPayment, totalInterest, totalPrincipal } = this.calculateTotals(schedule);
        
        html += this.generateTableRows(schedule);
        html += this.generateTableFooter(totalMonthlyPayment, totalInterest, totalPrincipal);
        
        // Add validation check if needed
        if (Math.abs(totalPrincipal - principal) > 0.01) {
            html += this.generateValidationError(totalPrincipal, principal);
        }

        html += '</tbody></table>';
        document.getElementById('schedule').innerHTML = html;
    }

    generateTableHeader() {
        return `
            <table class="table table-striped table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Miesiąc</th>
                        <th>Data</th>
                        <th>Dni w okresie</th>
                        <th>Rata</th>
                        <th>Odsetki</th>
                        <th>Kapitał</th>
                        <th>Odsetki dzienne</th>
                        <th>Pozostało do spłaty</th>
                    </tr>
                </thead>
                <tbody>
        `;
    }

    generateTableRows(schedule) {
        return schedule.map(item => {
            const date = item.date.toLocaleDateString('pl-PL', { 
                year: 'numeric', 
                month: 'long',
                day: 'numeric'
            });
            return `
                <tr>
                    <td>${item.month}</td>
                    <td>${date}</td>
                    <td>${item.daysInPeriod}</td>
                    <td>${item.monthlyPayment} zł</td>
                    <td>${item.interestPayment} zł</td>
                    <td>${item.principalPayment} zł</td>
                    <td>${item.dailyInterest} zł</td>
                    <td>${item.remainingPrincipal} zł</td>
                </tr>
            `;
        }).join('');
    }

    generateTableFooter(totalMonthlyPayment, totalInterest, totalPrincipal) {
        return `
            <tr class="table-info fw-bold">
                <td colspan="3">SUMA</td>
                <td>${this.calculator.formatCurrency(totalMonthlyPayment)} zł</td>
                <td>${this.calculator.formatCurrency(totalInterest)} zł</td>
                <td>${this.calculator.formatCurrency(totalPrincipal)} zł</td>
                <td>-</td>
                <td>-</td>
            </tr>
        `;
    }

    generateValidationError(totalPrincipal, principal) {
        return `
            <div class="alert alert-danger mt-3">
                <strong>Błąd walidacji:</strong> Suma spłaconego kapitału (${this.calculator.formatCurrency(totalPrincipal)} zł) 
                nie zgadza się z kwotą kredytu (${this.calculator.formatCurrency(principal)} zł).
                Różnica: ${this.calculator.formatCurrency(Math.abs(principal - totalPrincipal))} zł
            </div>
        `;
    }

    calculateTotals(schedule) {
        return schedule.reduce((acc, item) => {
            const monthlyPayment = parseFloat(item.monthlyPayment.replace(/\s/g, '').replace(',', '.'));
            const interestPayment = parseFloat(item.interestPayment.replace(/\s/g, '').replace(',', '.'));
            const principalPayment = parseFloat(item.principalPayment.replace(/\s/g, '').replace(',', '.'));
            
            return {
                totalMonthlyPayment: acc.totalMonthlyPayment + monthlyPayment,
                totalInterest: acc.totalInterest + interestPayment,
                totalPrincipal: acc.totalPrincipal + principalPayment
            };
        }, { totalMonthlyPayment: 0, totalInterest: 0, totalPrincipal: 0 });
    }

    calculateEarlyPayment() {
        const principal = parseFloat(document.getElementById('principal').value);
        const startDate = new Date(document.getElementById('startDate').value);
        const earlyPaymentDate = new Date(document.getElementById('earlyPaymentDate').value);
        
        if (!document.getElementById('earlyPaymentDate').value) {
            alert('Proszę wybrać datę wcześniejszej spłaty');
            return;
        }
        
        if (earlyPaymentDate <= startDate) {
            alert('Data wcześniejszej spłaty musi być późniejsza niż data rozpoczęcia kredytu');
            return;
        }

        const annualRate = parseFloat(document.getElementById('annualRate').value);
        const months = parseInt(document.getElementById('months').value);
        const earlyPaymentAmount = parseFloat(document.getElementById('earlyPaymentAmount').value);
        const interestType = document.getElementById('earlyPaymentInterestType').value;
        const paymentDay = parseInt(document.getElementById('paymentDay').value);

        if (earlyPaymentAmount <= 0) {
            alert('Kwota wcześniejszej spłaty musi być większa niż 0');
            return;
        }

        // Get original schedule
        const originalSchedule = this.calculator.calculateLoanSchedule(
            principal, annualRate, months, startDate, paymentDay
        ).schedule;

        const remainingPrincipal = parseFloat(originalSchedule.find(payment => 
            payment.date >= earlyPaymentDate)?.remainingPrincipal.replace(/\s/g, '').replace(',', '.')) || 0;

        if (earlyPaymentAmount >= remainingPrincipal) {
            alert('Kwota wcześniejszej spłaty nie może być większa niż pozostały kapitał do spłaty');
            return;
        }

        // Calculate schedules with early payment
        const shorterTermSchedule = this.calculator.calculateScheduleWithEarlyPayment(
            principal, annualRate, months, earlyPaymentAmount, earlyPaymentDate, 
            interestType, false, startDate, paymentDay
        );
        
        const lowerPaymentSchedule = this.calculator.calculateScheduleWithEarlyPayment(
            principal, annualRate, months, earlyPaymentAmount, earlyPaymentDate, 
            interestType, true, startDate, paymentDay
        );

        this.displayEarlyPaymentResults(originalSchedule, shorterTermSchedule, lowerPaymentSchedule, principal);
    }

    displayEarlyPaymentResults(originalSchedule, shorterTermSchedule, lowerPaymentSchedule, principal) {
        document.getElementById('earlyPaymentResults').style.display = 'block';
        
        const originalTotalInterest = this.calculator.calculateTotalInterest(originalSchedule);
        const shorterTermTotalInterest = this.calculator.calculateTotalInterest(shorterTermSchedule);
        const lowerPaymentTotalInterest = this.calculator.calculateTotalInterest(lowerPaymentSchedule);

        // Display savings and changes
        document.getElementById('shorterTermInterestSavings').textContent = 
            this.calculator.formatCurrency(originalTotalInterest - shorterTermTotalInterest) + ' zł';
        document.getElementById('lowerPaymentInterestSavings').textContent = 
            this.calculator.formatCurrency(originalTotalInterest - lowerPaymentTotalInterest) + ' zł';
        
        document.getElementById('monthsReduced').textContent = 
            originalSchedule.length - shorterTermSchedule.length;
        document.getElementById('newEndDate').textContent = 
            shorterTermSchedule[shorterTermSchedule.length - 1].date.toLocaleDateString('pl-PL');
        
        const originalMonthlyPayment = parseFloat(originalSchedule[1].monthlyPayment.replace(/\s/g, '').replace(',', '.'));
        const newMonthlyPayment = parseFloat(lowerPaymentSchedule[lowerPaymentSchedule.length - 1].monthlyPayment.replace(/\s/g, '').replace(',', '.'));
        
        document.getElementById('newMonthlyPayment').textContent = this.calculator.formatCurrency(newMonthlyPayment) + ' zł';
        document.getElementById('paymentReduction').textContent = this.calculator.formatCurrency(originalMonthlyPayment - newMonthlyPayment) + ' zł';

        // Display schedules
        this.displayScheduleComparison('shorterTermTable', originalSchedule, shorterTermSchedule, principal);
        this.displayScheduleComparison('lowerPaymentTable', originalSchedule, lowerPaymentSchedule, principal);

        // Update charts
        this.charts.updateComparisonCharts(originalSchedule, shorterTermSchedule, lowerPaymentSchedule);
    }

    displayScheduleComparison(tableId, originalSchedule, newSchedule, principal) {
        let html = `
            <table class="table table-striped table-hover">
                <thead class="table-light">
                    <tr>
                        <th>Miesiąc</th>
                        <th>Data</th>
                        <th>Rata</th>
                        <th>Odsetki</th>
                        <th>Kapitał</th>
                        <th>Pozostało do spłaty</th>
                        <th>Różnica w racie</th>
                    </tr>
                </thead>
                <tbody>
        `;

        for (let i = 0; i < Math.max(originalSchedule.length, newSchedule.length); i++) {
            const original = originalSchedule[i];
            const modified = newSchedule[i];

            if (modified) {
                const originalPayment = original ? parseFloat(original.monthlyPayment.replace(/\s/g, '').replace(',', '.')) : 0;
                const modifiedPayment = parseFloat(modified.monthlyPayment.replace(/\s/g, '').replace(',', '.'));
                const difference = originalPayment - modifiedPayment;

                const date = modified.date.toLocaleDateString('pl-PL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                html += `
                    <tr>
                        <td>${modified.month}</td>
                        <td>${date}</td>
                        <td>${modified.monthlyPayment} zł</td>
                        <td>${modified.interestPayment} zł</td>
                        <td>${modified.principalPayment} zł</td>
                        <td>${modified.remainingPrincipal} zł</td>
                        <td class="${difference > 0 ? 'text-success' : 'text-danger'}">
                            ${this.calculator.formatCurrency(Math.abs(difference))} zł
                        </td>
                    </tr>
                `;
            }
        }

        // Add summary row
        const totalOriginalPayments = originalSchedule.reduce((sum, payment) => 
            sum + parseFloat(payment.monthlyPayment.replace(/\s/g, '').replace(',', '.')), 0);
        const totalModifiedPayments = newSchedule.reduce((sum, payment) => 
            sum + parseFloat(payment.monthlyPayment.replace(/\s/g, '').replace(',', '.')), 0);
        const totalDifference = totalOriginalPayments - totalModifiedPayments;

        html += `
            <tr class="table-info fw-bold">
                <td colspan="2">SUMA</td>
                <td>${this.calculator.formatCurrency(totalModifiedPayments)} zł</td>
                <td>${this.calculator.formatCurrency(this.calculator.calculateTotalInterest(newSchedule))} zł</td>
                <td>${this.calculator.formatCurrency(principal)} zł</td>
                <td>-</td>
                <td class="${totalDifference > 0 ? 'text-success' : 'text-danger'}">
                    ${this.calculator.formatCurrency(Math.abs(totalDifference))} zł
                </td>
            </tr>
        `;

        html += '</tbody></table>';
        document.getElementById(tableId).innerHTML = html;
    }
}

// Export the UI class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoanUI;
} else {
    window.LoanUI = LoanUI;
} 