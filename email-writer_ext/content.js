console.log("Email Writer Extension - Content Script Loaded");

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-I J-J5-Ji aoO v7 T-I-atl L3 ai-reply-button';
    button.style.marginRight = '8px';
    button.style.display = 'inline-flex';
    button.style.alignItems = 'center';
    button.style.gap = '6px';
    button.style.background = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
    button.style.color = '#ffffff';
    button.style.borderRadius = '18px';
    button.style.padding = '0 14px';
    button.style.fontWeight = '500';
    button.style.cursor = 'pointer';
    button.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
        </svg>
        <span>AI Reply</span>
    `;
    button.setAttribute('role', 'button');
    button.setAttribute('data-tooltip', 'Generate AI Reply with Email Writer');
    return button;
}

function getEmailContent() {
    const selectors = [
        '.h7',
        '.a3s.aiL',
        '.gmail_quote',
        '[role="presentation"]'
    ];
    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content && content.innerText.trim()) {
            return content.innerText.trim();
        }
    }
    return '';
}

function findComposeToolbar() {
    const selectors = [
        '.btC',
        '.aDh',
        '[role="toolbar"]',
        '.gU.Up'
    ];
    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
    }
    return null;
}

function injectButton() {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar();
    if (!toolbar) {
        console.log("Toolbar not found");
        return;
    }

    console.log("Toolbar found, injecting AI button");
    const button = createAIButton();

    button.addEventListener('click', async () => {
        const labelSpan = button.querySelector('span');
        const originalText = labelSpan ? labelSpan.innerText : 'AI Reply';

        try {
            if (labelSpan) labelSpan.innerText = 'Generating...';
            button.style.opacity = '0.7';
            button.style.pointerEvents = 'none';

            const emailContent = getEmailContent();
            if (!emailContent) {
                alert('Could not find email content to reply to. Please open an email thread or select the text.');
                return;
            }

            const response = await fetch('http://localhost:8080/api/email/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailContent: emailContent,
                    tone: "professional"
                })
            });

            if (!response.ok) {
                throw new Error(`API Request Failed with status ${response.status}`);
            }

            const generatedReply = await response.text();
            
            // If the server returned an error message in text
            if (generatedReply.startsWith("Error:") || generatedReply.startsWith("Gemini API Error")) {
                alert(generatedReply);
                return;
            }

            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]');
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText', false, generatedReply);
            } else {
                console.error('Compose box was not found');
                alert('Reply generated! But compose box was not found. Please click inside the reply area.');
            }
        } catch (error) {
            console.error('Email Writer Error:', error);
            alert('Failed to generate reply. Ensure the Email Writer backend is running on http://localhost:8080');
        } finally {
            if (labelSpan) labelSpan.innerText = originalText;
            button.style.opacity = '1';
            button.style.pointerEvents = 'auto';
        }
    });

    toolbar.insertBefore(button, toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes);
        const hasComposeElements = addedNodes.some(node =>
            node.nodeType === Node.ELEMENT_NODE && 
            (node.matches('.aDh, .btC, [role="dialog"]') || node.querySelector('.aDh, .btC, [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton, 500);
        }
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});
