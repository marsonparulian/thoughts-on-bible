$(document).ready(function () {
    $(document).foundation();

    /**
    * Note:
    * `node` is the element that probably has `data-step` attribute. It will be shown or hidden based on the `step` value.
    * `step` will show all `node` elements that has `data-step` value <= to the given `step` value.
    * `maxStep` is the maximum value of `data-step` attribute from `.n` elements.
    * `stepObject` is an object that contains `step` value and array of related `node`.
    * `stepSeries` is a list of `stepObject`. Each `stepObject` contains `step` value and array of related `node`.
    * `indexMaxShownStepObject` is the index of the `stepObject` in `stepSeries`, which `stepObject.step` === `step`.
    */

    // Set `step` from the searchParam or set to 0
    let url = new URL(window.location.href);
    let step = url.searchParams.get('step');
    step = parseInt(step) || 0;

    // Setup all `step` related data
    const stepSeries = constructStepSeries();
    const maxStep = stepSeries[stepSeries.length - 1].step;
    step = normalizeStep(step);
    // The biggest index / latest of `stepObject`that currently is shown
    let indexMaxShownStepObject = stepSeries.findIndex(stepObject => stepObject.step === step);

    // References to the prev and next buttons
    const prevButton = document.querySelector('#timeline-prev');
    const nextButton = document.querySelector('#timeline-next');

    // Attach event listenerd to the previous and next buttons
    prevButton.addEventListener('click', previousStep);
    nextButton.addEventListener('click', nextStep);

    // Attach event listener for `.n .b button` to update modal's content accordingly
    attachDetailButtonsHandler();

    // Ready to show the timeline
    setStep(step);

    // End of initial process

    /**
     * Construct list of `step`. Each `step` contains array of `node`.
     * The `node` will be ordered from the least value of `data-step` attribute. Nodes with the same `data-step` value will be grouped in the same `step`.
     */
    function constructStepSeries() {
        // Collect all values of `data-step`
        let steps = Array.from(document.querySelectorAll('.n')).map(node => node.getAttribute('data-step'));

        // Convert the values to number
        steps = steps.map(step => parseInt(step) || 0);

        // Remove duplicate values
        steps = Array.from(new Set(steps));

        // Order the `data-step` values ascending
        steps.sort((a, b) => a - b);

        // Query all `node`s with the same `data-step` value and group them in the same `step`
        const stepSeries = steps.map(step => {
            return {
                step: step,
                nodes: Array.from(document.querySelectorAll(`[data-step="${step}"]`))
            };
        });

        return stepSeries;
    }

    /**
     * Normalize the `step` value to match the `stepSeries`. `step` value should be the max value of all the `step` values <= the given `step` value.
     * @param {number} step Current step value
     * @return {number} Normalized step value
     */
    function normalizeStep(step) {
        let normalizedStep = 0;

        stepSeries.forEach(stepData => {
            if (stepData.step <= step) {
                normalizedStep = stepData.step;
            }
        });

        return normalizedStep;
    }

    /**
     * Handler for the previous button
     */
    async function previousStep() {
        // FailSafe: If the current step is the first step, then do nothing
        if (indexMaxShownStepObject === 0) return;

        // Scroll to the `node` to be removed: the last added node
        const nodeToScrollTo = stepSeries[indexMaxShownStepObject].nodes[0];
        await scrollToTheFocusedNode(nodeToScrollTo);

        // Hide all `node` elements for the stepObject before move to the previous step
        const stepObject = stepSeries[indexMaxShownStepObject];
        for (let i = 0; i < stepObject.nodes.length; i++) {
            const classList = stepObject.nodes[i].classList

            // Add the `remove` class to apply animation
            classList.add('remove')

            // After animation ends, remove class `init` and `added` to make sure elements stay hidden
            stepObject.nodes[i].addEventListener('animationend', function handler() {
                classList.remove('init');
                classList.remove('added');

                // Remove the event listener
                stepObject.nodes[i].removeEventListener('animationend', handler);
            });

            await new Promise(r => setTimeout(r, 200))
        }

        // Move to the previous stepObject in the stepSeries
        indexMaxShownStepObject--;

        onStepChanged(stepSeries[indexMaxShownStepObject].step);
    }
    /**
     * Decide what is the next step
     */
    async function nextStep() {
        // FailSafe: If the current step is the last step, then do nothing
        if (indexMaxShownStepObject === stepSeries.length - 1) return;

        // Move to the next stepObject in the stepSeries
        indexMaxShownStepObject++;

        // Scroll to the previous sibling `node` of the node that are going to be added. The reason is because the to-be-added node is still hidden so we can not focus on that node.
        const nodeToBeAdded = stepSeries[indexMaxShownStepObject].nodes[0];
        let nodeToScrollTo = nodeToBeAdded.previousElementSibling;
        // Or, get the first node
        if (!nodeToScrollTo) nodeToScrollTo = stepSeries[0].nodes[0];
        await scrollToTheFocusedNode(nodeToScrollTo);

        // Show all `node` elements which should be shown based on the step value
        const stepObject = stepSeries[indexMaxShownStepObject];
        for (let i = 0; i < stepObject.nodes.length; i++) {
            const classList = stepObject.nodes[i].classList;
            classList.add('added');
            classList.remove('remove');

            await new Promise(r => setTimeout(r, 200))
        }

        onStepChanged(stepSeries[indexMaxShownStepObject].step);
    }

    /**
     * Scroll to a specific `node`
     */
    async function scrollToTheFocusedNode(nodeToScrollTo) {
        nodeToScrollTo.scrollIntoView({ behavior: 'smooth' });

        // TODO: If the `node` already in the view, do not need to scrool and wait

        // No need to wait. The 'waiting' for scroll to finish, will be done in CSS `animation-delay` for both 'previous' and 'next'
        return Promise.resolve();
    }

    /**
     * Execute side effects of `step` changed by prev / next button.
     */
    async function onStepChanged(newStep) {
        // Set the current step
        step = newStep;

        // Set the current step in the URL
        reflectStepInURL(step);

        // Set state of the nav buttons
        setNavButtonState(step);
    }
    /**
     * Set the current step, based on the given `step` value (from URL)
     * @param {number} step Current step value
     */
    async function setStep(step) {
        // Show all `node` elements which should be shown based on the step value
        // However the appearance should be by the order in HTML, not by the `data-step` value
        let nodes = Array.from(document.querySelectorAll('.n[data-step]'));
        for (let i = 0; i < nodes.length; i++) {
            if (parseInt(nodes[i].getAttribute('data-step')) <= step) {
                const classList = nodes[i].classList;
                classList.remove('remove');
                classList.add('init');
                await new Promise(r => setTimeout(r, 200))
            }
        }

        // Set state of the nav buttons
        setNavButtonState(step);
    }
    /**
     * Reflect the current step in the URL
     * @param {number} newStep Current step value
     */
    function reflectStepInURL(newStep) {
        const url = new URL(window.location.href);
        url.searchParams.set('step', newStep);
        // window.history.pushState({}, '', url);
        window.history.replaceState({}, '', url);
    }

    /**
     * Set the state of the nav buttons
     * @param {number} step Current step value
     */
    function setNavButtonState(step) {
        // Enable or disable the previous button based on the current step value
        if (step === 0) {
            prevButton.disabled = true;
        } else {
            prevButton.disabled = false;
        }

        // Enable or disable the next button based on the current step value
        if (step >= maxStep) {
            nextButton.disabled = true;
        } else {
            nextButton.disabled = false;
        }
    }

    /**
     * Attach event listener for `.n .b button` to clone the content of `.n .detail` to the Foundation's modal.
     * The modal toggle feature is handled by Foundation' utility
     * The modal is hidden by default.
     */
    function attachDetailButtonsHandler() {
        // Ref to the detailModal
        const detailModal = $('#detail-modal');

        $('.n .b button').on('click', function (e) {
            e.preventDefault();

            const titleContent = $(this).closest('.n').find('.k').html();
            const dateContent = $(this).closest('.n').find('.date').html();
            const detailContent = $(this).closest('.n').find('.detail').html();

            detailModal.find('h1').html(titleContent);
            detailModal.find('.lead').html(dateContent);
            detailModal.find('.content').html(detailContent);
        });
    }

});

