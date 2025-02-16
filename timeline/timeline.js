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
    let indexMaxShownStepObject = stepSeries.findIndex(stepObject => stepObject.step === step);

    // Ref to the prev and next buttons
    const prevButton = document.querySelector('#timeline-prev');
    const nextButton = document.querySelector('#timeline-next');

    // Attach event listener to the previous button
    prevButton.addEventListener('click', previousStep);
    // Attach event listener to the next button
    nextButton.addEventListener('click', nextStep);

    // Attach event listener for `.n .b button` to open Foundation's modal,
    attachDetailButtonsHandler();

    // Ready to show the timeline
    setStep(step);

    /**
     * Construct list of `step`. Each `step` contains array of `node`.
     * The `node` will be ordered from the least value of `data-step` attribute. Nodes with the same `data-step` value will be grouped in the same `step`.
     */
    function constructStepSeries() {
        // Collect all values of `data-step`
        // let steps = Array.from(document.querySelectorAll('[data-step]')).map(node => node.getAttribute('data-step'));
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

        // Scroll to the `node` to be removed
        await scrollToThePreviousNode();

        // Hide all `node` elements for the stepObject before move to the previous step
        const stepObject = stepSeries[indexMaxShownStepObject];
        for (let i = 0; i < stepObject.nodes.length; i++) {
            const classList = stepObject.nodes[i].classList

            // Add the `remove` class to apply animation
            classList.add('remove')

            // Remove the `show` class after the animation ends to make sure the element is hidden
            stepObject.nodes[i].addEventListener('animationend', function handler() {
                classList.remove('init');
                classList.remove('added');
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

        // Scroll to the `node`s to be inserted
        await scrollToThePreviousNode();

        // Decide what is the next step based on the current step value
        // Move to the next stepObject in the stepSeries
        indexMaxShownStepObject++;

        // Show all `node` elements which should be shown based on the step value
        const stepObject = stepSeries[indexMaxShownStepObject];
        for (let i = 0; i < stepObject.nodes.length; i++) {
            const classList = stepObject.nodes[i].classList;
            classList.remove('remove');
            classList.add('added');

            await new Promise(r => setTimeout(r, 200))
        }

        onStepChanged(stepSeries[indexMaxShownStepObject].step);
    }

    /**
     * Scroll to the `node` before the first `node` that going to be hidden, or scroll to the top `node`
     */
    async function scrollToThePreviousNode() {
        // Get the index before the stepObject which nodes are going to be hidden, or get the first index
        // const indexStepToShow = indexMaxShownStepObject - 1 || 0;
        const indexStepToShow = indexMaxShownStepObject;

        // Get the first `node`, which will be scrolled too
        const nodeToScroll = stepSeries[indexStepToShow].nodes[0];

        // addEventListener('scroll', function scrollEndHandler(e) {
        //     scrollTimeout = setTimeout(function () {
        //         console.log('Scroll ended');
        //     }, 100);
        // });

        nodeToScroll.scrollIntoView({ behavior: 'smooth' });

        // TODO: If the `node` already in the view, do not need to scrool and wait

        // The 'waiting' for scroll to finish, will be done in CSS `animation-delay` for both 'previous' and 'next'
        return Promise.resolve();
    }

    /**
     * Execute side effects of `step` changed by prev / next button.
     */
    async function onStepChanged(newStep) {
        // Set the current step
        step = newStep;

        // TODO Hide all `node` elements which should be hidden based on the step value



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
        // However the appearance shoud be by the order in HTML, not by the `data-step` value
        let nodes = Array.from(document.querySelectorAll('.n[data-step]'));
        for (let i = 0; i < nodes.length; i++) {
            if (parseInt(nodes[i].getAttribute('data-step')) <= step) {
                const classList = nodes[i].classList;
                classList.remove('remove');
                classList.add('init');
                classList.add('show');
                await new Promise(r => setTimeout(r, 200))
            }
        }

        // Set state of the nav buttons
        setNavButtonState(step);
    }
    /**
     * Reflect the current step in the URL
     * @param {number} step Current step value
     */
    function reflectStepInURL(step) {
        const url = new URL(window.location.href);
        url.searchParams.set('step', step);
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
            console.log('prev step is disabled');
        } else {
            prevButton.disabled = false;
        }

        // Enable or disable the next button based on the current step value
        if (step >= maxStep) {
            nextButton.disabled = true;
            console.log('next step is disabled');
        } else {
            nextButton.disabled = false;
        }
        // console.log(`max step: ${maxStep}`);
        // console.log(`current step : ${step}`);
        // console.log(`typeof step: ${typeof step}`);
    }

    /**
     * Attach event listener for `.n .b button` to open Foundation's modal, 
     * and clone the content of `.n .detail` to the Foundation's modal.
     * The modal is hidden by default.
     */
    function attachDetailButtonsHandler() {

        // let modal = new Foundation.Reveal($('#modal'));

        $('.n .b button').on('click', function (e) {
            e.preventDefault();

            const titleContent = $(this).closest('.n').find('.k').html();
            const dateContent = $(this).closest('.n').find('.date').html();
            const detailContent = $(this).closest('.n').find('.detail').html();

            $('#detail-modal h1').html(titleContent);
            $('#detail-modal .lead').html(dateContent);
            $('#detail-modal .content').html(detailContent);

            // new Foundation.Reveal($('#modal')).open();
            // $('#modal').foundation('open');
            // modal.open();
        });

        /**
         * Custom handler to close the modal
         */
        $('#modal .other-close-button').on('click', () => {
            // modal.close();
        });

    }




});

