const createButtons = [
    document.getElementById("create-btn"),
    document.getElementById("hero-create"),
    document.getElementById("nav-create"),
    document.getElementById("footer-create")
];

const modal = document.getElementById("capsule-modal");
const letterModal = document.getElementById("letter-modal");

const closeModal = document.getElementById("close-modal");
const closeLetter = document.getElementById("close-letter");

const form = document.getElementById("capsule-form");

const titleInput = document.getElementById("capsule-title");
const messageInput = document.getElementById("capsule-message");
const unlockDateInput = document.getElementById("unlock-date");
const photoInput = document.getElementById("capsule-photo");

const capsuleList = document.getElementById("capsule-list");

let capsules = [];

try {
    capsules = JSON.parse(localStorage.getItem("timeCapsules")) || [];
} catch {
    capsules = [];
}

function getToday() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

unlockDateInput.min = getToday();

function openModal() {
    modal.style.display = "flex";
}

function hideModal() {
    modal.style.display = "none";
    form.reset();
    unlockDateInput.min = getToday();
}

function hideLetter() {
    letterModal.style.display = "none";
}

createButtons.forEach(button => {
    if (button) {
        button.addEventListener("click", openModal);
    }
});

closeModal.addEventListener("click", hideModal);
closeLetter.addEventListener("click", hideLetter);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        hideModal();
    }
});

letterModal.addEventListener("click", event => {
    if (event.target === letterModal) {
        hideLetter();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        hideModal();
        hideLetter();
    }
});

function saveCapsules() {
    try {
        localStorage.setItem("timeCapsules", JSON.stringify(capsules));
        return true;
    } catch (error) {
        alert("Storage is full. Try removing a photo or deleting an old capsule.");
        return false;
    }
}

function deleteCapsule(id) {
    const confirmed = confirm(
        "Are you sure you want to delete this memory? This cannot be undone."
    );

    if (!confirmed) return;

    const previousCapsules = capsules;

    capsules = capsules.filter(capsule => capsule.id !== id);

    if (saveCapsules()) {
        displayCapsules();
    } else {
        capsules = previousCapsules;
    }
}

function openLetter(id) {
    const capsule = capsules.find(item => item.id === id);

    if (!capsule) return;

    if (getToday() < capsule.unlockDate) {
        alert("This letter is still sealed. Come back on its unlock date!");
        return;
    }

    document.getElementById("letter-title").textContent = capsule.title;

    document.getElementById("letter-date").textContent =
        "Written for " + capsule.unlockDate;

    document.getElementById("letter-message").textContent = capsule.message;

    const photo = document.getElementById("letter-photo");

    if (capsule.photo) {
        photo.src = capsule.photo;
        photo.style.display = "block";
    } else {
        photo.removeAttribute("src");
        photo.style.display = "none";
    }

    letterModal.style.display = "flex";
}

function displayCapsules() {
    capsuleList.innerHTML = "";

    if (capsules.length === 0) {
        capsuleList.innerHTML = `
            <div class="empty-state">
                <h3>Your story starts here.</h3>
                <p>Create your first capsule and leave a little message for tomorrow.</p>
            </div>
        `;
        return;
    }

    capsules.forEach(capsule => {
        const unlocked = getToday() >= capsule.unlockDate;

        const card = document.createElement("article");
        card.className = "memory-card";

        const heading = document.createElement("h3");
        heading.textContent = capsule.title;

        const date = document.createElement("p");
        date.textContent = "Unlock date: " + capsule.unlockDate;

        const status = document.createElement("span");
        status.className = "memory-status";
        status.textContent = unlocked ? "🔓 Unlocked" : "🔒 Sealed";

        const preview = document.createElement("p");
        preview.textContent = unlocked
            ? "Your letter is ready to be opened."
            : "A little surprise is waiting for your future self.";

        card.appendChild(heading);
        card.appendChild(date);
        card.appendChild(status);
        card.appendChild(preview);

        if (!unlocked) {
            const remaining = Math.ceil(
                (new Date(capsule.unlockDate + "T00:00:00") -
                new Date(getToday() + "T00:00:00")) /
                (1000 * 60 * 60 * 24)
            );

            const countdown = document.createElement("p");
            countdown.textContent = `⌛ ${remaining} day(s) remaining`;

            card.appendChild(countdown);
        }

        if (unlocked) {
            const openButton = document.createElement("button");

            openButton.className = "open-letter-btn";
            openButton.textContent = "✉ Open My Letter";

            openButton.addEventListener("click", () => {
                openLetter(capsule.id);
            });

            card.appendChild(openButton);
        }

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-capsule-btn";
        deleteButton.textContent = "Delete Capsule";

        deleteButton.addEventListener("click", () => {
            deleteCapsule(capsule.id);
        });

        card.appendChild(deleteButton);

        capsuleList.appendChild(card);
    });
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    const unlockDate = unlockDateInput.value;
    const photoFile = photoInput.files[0];

    if (!title || !message || !unlockDate) {
        alert("Please fill in all required fields.");
        return;
    }

    if (unlockDate < getToday()) {
        alert("Please choose today or a future date.");
        return;
    }

    if (photoFile && !photoFile.type.startsWith("image/")) {
        alert("Please select a valid image.");
        return;
    }

    if (photoFile && photoFile.size > 1024 * 1024) {
        alert("Please choose a photo smaller than 1 MB.");
        return;
    }

    function createCapsule(photo = null) {
        const newCapsule = {
            id: Date.now().toString() + Math.random().toString(16).slice(2),
            title,
            message,
            unlockDate,
            photo
        };

        capsules.push(newCapsule);

        if (saveCapsules()) {
            displayCapsules();
            hideModal();
        } else {
            capsules.pop();
        }
    }

    if (photoFile) {
        const reader = new FileReader();

        reader.onload = () => createCapsule(reader.result);

        reader.onerror = () => {
            alert("Unable to read this photograph.");
        };

        reader.readAsDataURL(photoFile);
    } else {
        createCapsule();
    }
});

displayCapsules();