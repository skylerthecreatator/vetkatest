(() => {
    const modal = document.getElementById('catalogOrderModal');
    const form = document.getElementById('catalogOrderForm');
    const formStep = document.getElementById('catalogOrderFormStep');
    const thanksStep = document.getElementById('catalogOrderThanks');
    const context = document.getElementById('catalogOrderContext');
    const nameInput = document.getElementById('catalogClientName');
    const phoneInput = document.getElementById('catalogClientPhone');
    const nameError = document.getElementById('catalogNameError');
    const phoneError = document.getElementById('catalogPhoneError');
    const generalError = document.getElementById('catalogGeneralError');
    const submitButton = document.getElementById('catalogOrderSubmit');
    let selection = null;
    let opener = null;

    function setError(input, error, isInvalid) {
        input.classList.toggle('form-input--error', isInvalid);
        error.classList.toggle('form-error--visible', isInvalid);
    }

    function applyPhoneMask() {
        let value = phoneInput.value.replace(/\D/g, '');
        if (value.startsWith('8')) value = `7${value.slice(1)}`;
        if (!value.startsWith('7')) {
            phoneInput.value = value.slice(0, 15);
            return;
        }
        value = value.slice(0, 11);
        let formatted = '+7';
        if (value.length > 1) formatted += ` (${value.slice(1, 4)}`;
        if (value.length > 4) formatted += `) ${value.slice(4, 7)}`;
        if (value.length > 7) formatted += `-${value.slice(7, 9)}`;
        if (value.length > 9) formatted += `-${value.slice(9, 11)}`;
        phoneInput.value = formatted;
    }

    function closeModal() {
        if (!modal.classList.contains('modal-active')) return;
        modal.classList.remove('modal-active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        opener?.focus?.();
    }

    window.openCatalogOrderModal = ({ category, product, price }) => {
        selection = { category, product, price };
        opener = document.activeElement;
        form.reset();
        formStep.classList.remove('modal-step--hidden');
        thanksStep.classList.add('modal-step--hidden');
        [nameInput, phoneInput].forEach(input => input.classList.remove('form-input--error'));
        [nameError, phoneError, generalError].forEach(error => error.classList.remove('form-error--visible'));
        generalError.textContent = '';
        context.replaceChildren();
        const label = document.createElement('span');
        label.textContent = 'Вы выбрали';
        const selected = document.createElement('strong');
        selected.textContent = `${category} — ${product}`;
        context.append(label, selected);
        if (price) {
            const priceLine = document.createElement('small');
            priceLine.textContent = price;
            context.append(priceLine);
        }
        modal.classList.add('modal-active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        window.setTimeout(() => nameInput.focus(), 120);
    };

    phoneInput.addEventListener('input', applyPhoneMask);
    document.getElementById('catalogOrderClose').addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') closeModal();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const validName = name.length >= 2;
        const validPhone = phone.replace(/\D/g, '').length >= 11;
        setError(nameInput, nameError, !validName);
        setError(phoneInput, phoneError, !validPhone);
        if (!validName || !validPhone || !selection) return;

        generalError.classList.remove('form-error--visible');
        submitButton.classList.add('form-submit-btn--loading');
        submitButton.disabled = true;
        const sourceDetail = [selection.category, selection.product, selection.price].filter(Boolean).join(' — ');

        try {
            const response = await fetch('/api/submit-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    phone,
                    messenger: document.querySelector('input[name="catalogMessenger"]:checked')?.value || 'telegram',
                    source: 'catalog',
                    sourceLabel: 'Каталог — выбранный вариант',
                    sourceDetail,
                    comment: document.getElementById('catalogClientComment').value.trim(),
                    bonusApplied: false,
                    website: document.getElementById('catalogHpWebsite').value,
                }),
            });
            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error(data.error || 'submit_failed');
            formStep.classList.add('modal-step--hidden');
            thanksStep.classList.remove('modal-step--hidden');
        } catch (error) {
            generalError.textContent = 'Не получилось отправить заявку. Проверьте связь и попробуйте ещё раз.';
            generalError.classList.add('form-error--visible');
        } finally {
            submitButton.classList.remove('form-submit-btn--loading');
            submitButton.disabled = false;
        }
    });
})();
