class LoanCalculator {
    constructor(locale = 'pl-PL') {
        this.LOCALE = locale;
    }

    formatCurrency(value) {
        return value.toLocaleString(this.LOCALE, { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    }

    calculateLoanSchedule(principal, annualRate, months, startDate, paymentDay, paymentType = 'equal') {
        if (paymentType === 'equal') {
            return this.calculateEqualPaymentSchedule(principal, annualRate, months, startDate, paymentDay);
        } else {
            return this.calculateDecreasingPaymentSchedule(principal, annualRate, months, startDate, paymentDay);
        }
    }

    calculateEqualPaymentSchedule(principal, annualRate, months, startDate, paymentDay) {
        const principalCents = Math.round(principal * 100);
        let remainingPrincipalCents = principalCents;
        const schedule = [];

        let previousDate = new Date(startDate);
        let totalPrincipalPaidCents = 0;
        let totalInterestPaidCents = 0;
        let totalPaymentsCents = 0;

        const yearRate = annualRate / 100;
        const monthlyRate = yearRate / 12;

        // Calculate fixed monthly payment for equal payments (annuity)
        const baseMonthlyPaymentCents = Math.round(principalCents * 
            ((monthlyRate * Math.pow(1 + monthlyRate, months)) / 
            (Math.pow(1 + monthlyRate, months) - 1)));

        for (let month = 1; month <= months; month++) {
            let currentDate = this.calculatePaymentDate(startDate, previousDate, month, paymentDay);
            const daysInPeriod = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));
            previousDate = currentDate;
            
            const daysInYear = (currentDate.getFullYear() % 4 === 0) ? 366 : 365;
            const dailyRate = yearRate / daysInYear;
            const interestPaymentCents = Math.round(remainingPrincipalCents * dailyRate * daysInPeriod);
            
            let monthlyPaymentCents;
            let principalPaymentCents;

            const remainingMonths = months - month + 1;

            if (month === 1) {
                monthlyPaymentCents = Math.round(baseMonthlyPaymentCents * (daysInPeriod / 30));
            } else if (month === months || remainingPrincipalCents <= baseMonthlyPaymentCents) {
                monthlyPaymentCents = remainingPrincipalCents + interestPaymentCents;
            } else {
                monthlyPaymentCents = Math.round(remainingPrincipalCents * 
                    ((monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                    (Math.pow(1 + monthlyRate, remainingMonths) - 1)));
            }

            principalPaymentCents = monthlyPaymentCents - interestPaymentCents;

            if (principalPaymentCents > remainingPrincipalCents) {
                principalPaymentCents = remainingPrincipalCents;
                monthlyPaymentCents = principalPaymentCents + interestPaymentCents;
            }

            totalPrincipalPaidCents += principalPaymentCents;
            totalInterestPaidCents += interestPaymentCents;
            totalPaymentsCents += monthlyPaymentCents;
            remainingPrincipalCents = principalCents - totalPrincipalPaidCents;

            schedule.push(this.createPaymentEntry(
                month, currentDate, daysInPeriod, remainingPrincipalCents,
                monthlyPaymentCents, interestPaymentCents, principalPaymentCents,
                dailyRate
            ));

            if (remainingPrincipalCents <= 0) break;
        }

        return {
            schedule,
            totals: {
                principalCents: totalPrincipalPaidCents,
                interestCents: totalInterestPaidCents,
                paymentsCents: totalPaymentsCents
            }
        };
    }

    calculateDecreasingPaymentSchedule(principal, annualRate, months, startDate, paymentDay) {
        const principalCents = Math.round(principal * 100);
        let remainingPrincipalCents = principalCents;
        const schedule = [];

        let previousDate = new Date(startDate);
        let totalPrincipalPaidCents = 0;
        let totalInterestPaidCents = 0;
        let totalPaymentsCents = 0;

        const yearRate = annualRate / 100;
        const monthlyRate = yearRate / 12;
        const baseMonthlyPrincipalCents = Math.round(principalCents / months);

        for (let month = 1; month <= months; month++) {
            let currentDate = this.calculatePaymentDate(startDate, previousDate, month, paymentDay);
            const daysInPeriod = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));
            previousDate = currentDate;
            
            const daysInYear = (currentDate.getFullYear() % 4 === 0) ? 366 : 365;
            const dailyRate = yearRate / daysInYear;
            const interestPaymentCents = Math.round(remainingPrincipalCents * dailyRate * daysInPeriod);
            
            let monthlyPaymentCents;
            let principalPaymentCents;

            if (month === 1) {
                principalPaymentCents = Math.round(baseMonthlyPrincipalCents * (daysInPeriod / 30));
            } else if (month === months) {
                principalPaymentCents = remainingPrincipalCents;
            } else {
                principalPaymentCents = baseMonthlyPrincipalCents;
            }

            monthlyPaymentCents = principalPaymentCents + interestPaymentCents;

            totalPrincipalPaidCents += principalPaymentCents;
            totalInterestPaidCents += interestPaymentCents;
            totalPaymentsCents += monthlyPaymentCents;
            remainingPrincipalCents = principalCents - totalPrincipalPaidCents;

            schedule.push(this.createPaymentEntry(
                month, currentDate, daysInPeriod, remainingPrincipalCents,
                monthlyPaymentCents, interestPaymentCents, principalPaymentCents,
                dailyRate
            ));

            if (remainingPrincipalCents <= 0) break;
        }

        return {
            schedule,
            totals: {
                principalCents: totalPrincipalPaidCents,
                interestCents: totalInterestPaidCents,
                paymentsCents: totalPaymentsCents
            }
        };
    }

    calculateScheduleWithEarlyPayment(principal, annualRate, months, earlyPaymentAmount, earlyPaymentDate, interestType, keepTerm, startDate, paymentDay) {
        const principalCents = Math.round(principal * 100);
        let remainingPrincipalCents = principalCents;
        const schedule = [];

        const yearRate = annualRate / 100;
        const monthlyRate = yearRate / 12;

        // Calculate base monthly payment in cents
        const baseMonthlyPaymentCents = Math.round(principalCents * 
            ((monthlyRate * Math.pow(1 + monthlyRate, months)) / 
            (Math.pow(1 + monthlyRate, months) - 1)));

        let previousDate = new Date(startDate);
        let totalPrincipalPaidCents = 0;
        let earlyPaymentApplied = false;
        let newMonthlyPaymentCents = baseMonthlyPaymentCents;

        for (let month = 1; month <= months; month++) {
            let currentDate = this.calculatePaymentDate(startDate, previousDate, month, paymentDay);

            // Check if early payment should be applied
            if (!earlyPaymentApplied && currentDate >= earlyPaymentDate) {
                earlyPaymentApplied = true;
                const earlyPaymentCents = Math.round(earlyPaymentAmount * 100);
                
                if (interestType === 'full') {
                    const daysToEarlyPayment = Math.round((earlyPaymentDate - previousDate) / (1000 * 60 * 60 * 24));
                    const daysInYear = (earlyPaymentDate.getFullYear() % 4 === 0) ? 366 : 365;
                    const additionalInterestCents = Math.round(remainingPrincipalCents * (yearRate / daysInYear) * daysToEarlyPayment);
                    remainingPrincipalCents -= (earlyPaymentCents - additionalInterestCents);
                } else {
                    remainingPrincipalCents -= earlyPaymentCents;
                }

                if (keepTerm) {
                    const remainingMonths = months - month + 1;
                    newMonthlyPaymentCents = Math.round((remainingPrincipalCents / 100) * 
                        ((monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                        (Math.pow(1 + monthlyRate, remainingMonths) - 1)) * 100);
                }
            }

            if (remainingPrincipalCents <= 0) break;

            const daysInPeriod = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));
            previousDate = currentDate;
            
            const daysInYear = (currentDate.getFullYear() % 4 === 0) ? 366 : 365;
            const dailyRate = yearRate / daysInYear;
            const interestPaymentCents = Math.round(remainingPrincipalCents * dailyRate * daysInPeriod);
            
            let monthlyPaymentCents = newMonthlyPaymentCents;
            let principalPaymentCents;

            if (month === 1) {
                monthlyPaymentCents = Math.round(monthlyPaymentCents * (daysInPeriod / 30));
                principalPaymentCents = monthlyPaymentCents - interestPaymentCents;
            } else if (remainingPrincipalCents <= monthlyPaymentCents) {
                principalPaymentCents = remainingPrincipalCents;
                monthlyPaymentCents = principalPaymentCents + interestPaymentCents;
            } else {
                principalPaymentCents = monthlyPaymentCents - interestPaymentCents;
            }

            totalPrincipalPaidCents += principalPaymentCents;
            remainingPrincipalCents = principalCents - totalPrincipalPaidCents;

            schedule.push(this.createPaymentEntry(
                month, currentDate, daysInPeriod, remainingPrincipalCents,
                monthlyPaymentCents, interestPaymentCents, principalPaymentCents,
                dailyRate
            ));
        }

        return schedule;
    }

    calculatePaymentDate(startDate, previousDate, month, paymentDay) {
        let currentDate;
        if (month === 1) {
            currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, paymentDay);
            if (currentDate <= startDate) {
                currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 2, paymentDay);
            }
        } else {
            currentDate = new Date(previousDate.getFullYear(), previousDate.getMonth() + 1, paymentDay);
        }
        return currentDate;
    }

    createPaymentEntry(month, date, daysInPeriod, remainingPrincipalCents, monthlyPaymentCents, 
                      interestPaymentCents, principalPaymentCents, dailyRate) {
        return {
            month,
            date,
            daysInPeriod,
            dailyInterest: this.formatCurrency((remainingPrincipalCents * dailyRate) / 100),
            monthlyPayment: this.formatCurrency(monthlyPaymentCents / 100),
            interestPayment: this.formatCurrency(interestPaymentCents / 100),
            principalPayment: this.formatCurrency(principalPaymentCents / 100),
            remainingPrincipal: this.formatCurrency(remainingPrincipalCents / 100)
        };
    }

    calculateTotalInterest(schedule) {
        return schedule.reduce((sum, payment) => 
            sum + parseFloat(payment.interestPayment.replace(/\s/g, '').replace(',', '.')), 0);
    }
}

// Export the calculator class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoanCalculator;
} else {
    window.LoanCalculator = LoanCalculator;
} 