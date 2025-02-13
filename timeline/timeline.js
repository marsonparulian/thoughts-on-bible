

$(document).ready(function () {
    $(document).foundation();

    // Set `step` from the searchParam or set to 0
    let url = new URL(window.location.href);
    let step = url.searchParams.get('step');
    step ??= 0;

    // Setup `step` related data
    const stepSeries = constructStepSeries();

    // console.log(`step : ${step}`);

    /**
     * Construct list of `step`. Each `step` contains array of `node`.
     * The `node` will be ordered from the least value of `data-step` attribute. Nodes with the same `data-step` value will be grouped in the same `step`.
     */
    function constructStepSeries() {
        // Collect all values of `data-step`
        let steps = Array.from(document.querySelectorAll('[data-step]')).map(node => node.getAttribute('data-step'));

        // Remove duplicate values
        steps = Array.from(new Set(steps));
        console.log(steps);

        // Order the `data-step` values ascending
        steps.sort((a, b) => a - b);

        // Query all `node`s with the same `data-step` value and group them in the same `step`
        const stepSeries = steps.map(step => {
            return {
                step: step,
                nodes: Array.from(document.querySelectorAll(`[data-step="${step}"]`))
            };
        });

        console.log(stepSeries);
    }
    /**
     * Decide what is the next step
     */
    function nextStep() {
        // TODO Decide what is the next step based on the current step value
        let nextStep = 999;

        set(nextStep)
    }
    /**
     * Set the current step 
     */
    function setStep(step) {
        // TODO Show all `node` elements which should be shown based on the step value


        // Set the current step in the URL
        url.searchParams.set('step', step);
        window.history.replaceState({}, '', url);
    }
});