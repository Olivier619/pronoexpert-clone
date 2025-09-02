document.addEventListener('DOMContentLoaded', () => {
    console.log("Le DOM est chargé. Le script main.js est en cours d'exécution.");

    let draggedSrc = null; // Variable globale pour stocker la source de l'image

    const thumbnails = document.querySelectorAll('#panel-thumbnails img');
    const editorArea = document.getElementById('editor-area');

    // 1. Rendre les vignettes déplaçables
    thumbnails.forEach(thumb => {
        thumb.setAttribute('draggable', 'true');
        thumb.addEventListener('dragstart', handleDragStart);
    });

    // 2. Préparer la zone de dépôt
    if (editorArea) {
        editorArea.addEventListener('dragover', handleDragOver);
        editorArea.addEventListener('drop', handleDrop);
    }

    function handleDragStart(e) {
        console.log('dragstart fired');
        // Utiliser dataTransfer pour les navigateurs standards
        e.dataTransfer.setData('text/plain', e.target.src);
        // Utiliser la variable globale comme fallback pour Playwright
        draggedSrc = e.target.src;
    }

    function handleDragOver(e) {
        e.preventDefault(); // Nécessaire pour autoriser un 'drop'
        console.log('dragover fired');
    }

    function handleDrop(e) {
        e.preventDefault();
        console.log('drop fired');
        let imgSrc = e.dataTransfer.getData('text/plain');

        if (!imgSrc) {
            console.log('dataTransfer est vide, utilisation du fallback draggedSrc');
            imgSrc = draggedSrc;
        }

        if (!imgSrc) {
            console.error('Impossible de récupérer la source de l\'image à déposer.');
            return;
        }

        // Créer une nouvelle image dans l'éditeur
        const newImg = document.createElement('img');
        newImg.src = imgSrc;
        newImg.style.position = 'absolute'; // Pour un positionnement libre

        // Calculer la position relative à la zone de l'éditeur
        const editorRect = editorArea.getBoundingClientRect();
        const x = e.clientX - editorRect.left;
        const y = e.clientY - editorRect.top;

        newImg.style.left = `${x}px`;
        newImg.style.top = `${y}px`;
        newImg.style.maxWidth = '150px'; // Une taille par défaut
        newImg.style.cursor = 'move';

        editorArea.appendChild(newImg);

        // Rendre la nouvelle image déplaçable à l'intérieur de l'éditeur
        makeElementDraggable(newImg);
    }

    function makeElementDraggable(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        elmnt.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            // Obtenir la position initiale du curseur
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            // Appeler une fonction à chaque fois que le curseur bouge
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            // Calculer la nouvelle position du curseur
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // Définir la nouvelle position de l'élément
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
            elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            // Arrêter le mouvement lorsque le bouton de la souris est relâché
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // 3. Gérer la sauvegarde
    const saveButton = document.getElementById('save-button');
    if (saveButton) {
        saveButton.addEventListener('click', handleSave);
    }

    async function handleSave() {
        const editorImages = editorArea.querySelectorAll('img:not([alt="Planche de BD"])');
        const imagesData = [];

        editorImages.forEach(img => {
            // Extraire le nom du fichier de l'URL
            const url = new URL(img.src);
            const filename = url.pathname.split('/').pop();

            imagesData.push({
                src: filename,
                x: parseInt(img.style.left, 10),
                y: parseInt(img.style.top, 10),
                width: img.width,
                height: img.height
            });
        });

        // Envoyer les données au serveur
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ images: imagesData })
        });

        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = 'ma_planche_de_bd.png';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
        } else {
            console.error('Erreur lors de la génération de l\'image.');
            alert('Une erreur est survenue lors de la génération de l\'image.');
        }
    }

    // -- Fonction d'aide pour les tests Playwright --
    window.test_forceDrop = (imgSrc) => {
        const newImg = document.createElement('img');
        newImg.src = imgSrc;
        newImg.style.position = 'absolute';
        // Positionner au centre pour la vérification
        newImg.style.left = '100px';
        newImg.style.top = '100px';
        newImg.style.maxWidth = '150px';
        newImg.style.cursor = 'move';
        editorArea.appendChild(newImg);
        makeElementDraggable(newImg);
        console.log('Image déposée de force pour le test.');
    }
});
