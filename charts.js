class LoanCharts {
    constructor() {
        this.monthlyChart = null;
        this.cumulativeChart = null;
        this.shorterTermChart = null;
        this.lowerPaymentChart = null;
    }

    generateMonthlyChart(data) {
        const ctx = document.getElementById('monthlyPaymentChart').getContext('2d');
        if (this.monthlyChart) {
            this.monthlyChart.destroy();
        }
        this.monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(item => item.month),
                datasets: [
                    {
                        label: 'Odsetki',
                        data: data.map(item => parseFloat(item.interestPayment.replace(/\s/g, '').replace(',', '.'))),
                        backgroundColor: '#dc3545'
                    },
                    {
                        label: 'Kapitał',
                        data: data.map(item => parseFloat(item.principalPayment.replace(/\s/g, '').replace(',', '.'))),
                        backgroundColor: '#198754'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Struktura raty w czasie'
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pl-PL', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                }) + ' zł';
                            }
                        }
                    }
                }
            }
        });
    }

    generateCumulativeChart(data) {
        const ctx = document.getElementById('cumulativePaymentChart').getContext('2d');
        let cumulativeInterest = 0;
        let cumulativePrincipal = 0;
        
        const cumulativeData = data.map(item => {
            cumulativeInterest += parseFloat(item.interestPayment.replace(/\s/g, '').replace(',', '.'));
            cumulativePrincipal += parseFloat(item.principalPayment.replace(/\s/g, '').replace(',', '.'));
            return {
                interest: cumulativeInterest,
                principal: cumulativePrincipal
            };
        });

        if (this.cumulativeChart) {
            this.cumulativeChart.destroy();
        }
        this.cumulativeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(item => item.month),
                datasets: [
                    {
                        label: 'Spłacone odsetki',
                        data: cumulativeData.map(item => item.interest),
                        borderColor: '#dc3545',
                        backgroundColor: '#dc3545',
                        fill: false
                    },
                    {
                        label: 'Spłacony kapitał',
                        data: cumulativeData.map(item => item.principal),
                        borderColor: '#198754',
                        backgroundColor: '#198754',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Suma spłat w czasie'
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pl-PL', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                }) + ' zł';
                            }
                        }
                    }
                }
            }
        });
    }

    updateComparisonCharts(originalSchedule, shorterTermSchedule, lowerPaymentSchedule) {
        this.updateShorterTermChart(originalSchedule, shorterTermSchedule);
        this.updateLowerPaymentChart(originalSchedule, lowerPaymentSchedule);
    }

    updateShorterTermChart(originalSchedule, shorterTermSchedule) {
        const ctx = document.getElementById('shorterTermChart').getContext('2d');
        if (this.shorterTermChart instanceof Chart) {
            this.shorterTermChart.destroy();
        }
        this.shorterTermChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: shorterTermSchedule.map(item => item.month),
                datasets: [
                    {
                        label: 'Oryginalna rata',
                        data: originalSchedule.map(item => parseFloat(item.monthlyPayment.replace(/\s/g, '').replace(',', '.'))),
                        borderColor: '#6c757d',
                        backgroundColor: '#6c757d',
                        fill: false
                    },
                    {
                        label: 'Nowa rata',
                        data: shorterTermSchedule.map(item => parseFloat(item.monthlyPayment.replace(/\s/g, '').replace(',', '.'))),
                        borderColor: '#198754',
                        backgroundColor: '#198754',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Porównanie rat - wariant z krótszym okresem'
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pl-PL', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                }) + ' zł';
                            }
                        }
                    }
                }
            }
        });
    }

    updateLowerPaymentChart(originalSchedule, lowerPaymentSchedule) {
        const ctx = document.getElementById('lowerPaymentChart').getContext('2d');
        if (this.lowerPaymentChart instanceof Chart) {
            this.lowerPaymentChart.destroy();
        }
        this.lowerPaymentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: lowerPaymentSchedule.map(item => item.month),
                datasets: [
                    {
                        label: 'Oryginalna rata',
                        data: originalSchedule.map(item => parseFloat(item.monthlyPayment.replace(/\s/g, '').replace(',', '.'))),
                        borderColor: '#6c757d',
                        backgroundColor: '#6c757d',
                        fill: false
                    },
                    {
                        label: 'Nowa rata',
                        data: lowerPaymentSchedule.map(item => parseFloat(item.monthlyPayment.replace(/\s/g, '').replace(',', '.'))),
                        borderColor: '#0d6efd',
                        backgroundColor: '#0d6efd',
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Porównanie rat - wariant z niższą ratą'
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('pl-PL', { 
                                    minimumFractionDigits: 2, 
                                    maximumFractionDigits: 2 
                                }) + ' zł';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Export the charts class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoanCharts;
} else {
    window.LoanCharts = LoanCharts;
} 