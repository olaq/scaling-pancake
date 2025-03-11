// Simple test framework
function assertEquals(actual, expected, message) {
    const tolerance = 0.01; // 1 cent tolerance
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${message}: expected ${expected} but got ${actual}`);
    }
}

function runTests() {
    // Test case 1: Basic equal payment (annuity) loan
    function testEqualPaymentSchedule() {
        const principal = 300000;
        const annualRate = 5;
        const months = 360;
        const result = calculateEqualPaymentSchedule(
            Math.round(principal * 100),
            annualRate / 100,
            (annualRate / 100) / 12,
            months,
            new Date('2024-03-01'),
            1
        );

        // Validate total principal equals loan amount
        assertEquals(
            result.totals.principalCents / 100,
            principal,
            'Total principal should equal loan amount'
        );

        // Validate first regular payment
        const firstRegularPayment = parseFloat(result.schedule[1].monthlyPayment.replace(/\s/g, '').replace(',', '.'));
        assertEquals(firstRegularPayment, 1610.46, 'First regular payment should be 1610.46');

        // Validate monthly payments are equal (except first and last)
        const regularPayments = result.schedule.slice(1, -1).map(
            p => parseFloat(p.monthlyPayment.replace(/\s/g, '').replace(',', '.'))
        );
        const isRegularPaymentsEqual = regularPayments.every(
            payment => Math.abs(payment - regularPayments[0]) < 0.01
        );
        if (!isRegularPaymentsEqual) {
            throw new Error('Regular monthly payments should be equal');
        }
    }

    // Test case 2: Basic decreasing payment loan
    function testDecreasingPaymentSchedule() {
        const principal = 300000;
        const annualRate = 5;
        const months = 360;
        const result = calculateDecreasingPaymentSchedule(
            Math.round(principal * 100),
            annualRate / 100,
            (annualRate / 100) / 12,
            months,
            new Date('2024-03-01'),
            1
        );

        // Validate total principal equals loan amount
        assertEquals(
            result.totals.principalCents / 100,
            principal,
            'Total principal should equal loan amount'
        );

        // Validate principal portions are equal (except first and last)
        const regularPrincipalPayments = result.schedule.slice(1, -1).map(
            p => parseFloat(p.principalPayment.replace(/\s/g, '').replace(',', '.'))
        );
        const isRegularPrincipalEqual = regularPrincipalPayments.every(
            payment => Math.abs(payment - regularPrincipalPayments[0]) < 0.01
        );
        if (!isRegularPrincipalEqual) {
            throw new Error('Regular principal payments should be equal');
        }
    }

    // Run all tests
    try {
        testEqualPaymentSchedule();
        testDecreasingPaymentSchedule();
        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
} 