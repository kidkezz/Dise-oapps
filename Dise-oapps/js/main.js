// main.js

// Inicializa el carrito desde localStorage o un array vacío
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// --- Funciones de Utilidad del Carrito ---

// Guarda el estado actual del carrito en localStorage y actualiza el contador
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCounter();
}

// Actualiza el número de artículos en el icono del carrito en la barra de navegación
function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    if (counter) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        counter.textContent = totalItems;
        // Muestra u oculta el contador dependiendo si hay artículos
        counter.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Actualiza el precio total en la página del carrito y maneja el mensaje de carrito vacío
function updateCartTotal() {
    const totalElement = document.getElementById('cart-total');
    const emptyMessage = document.getElementById('empty-cart-message');
    const cartSummary = document.querySelector('.cart-summary'); // El div que contiene total y botón

    if (totalElement) {
        const total = cart.reduce((sum, item) => {
            // Asegúrate de parsear el precio correctamente. Quita el '$' y convierte a float.
            const price = parseFloat(item.price.replace('$', ''));
            return sum + (price * item.quantity);
        }, 0);
        totalElement.textContent = `Total: $${total.toFixed(2)}`;

        if (cart.length === 0) {
            if (emptyMessage) emptyMessage.style.display = 'block';
            if (cartSummary) cartSummary.style.display = 'none'; // Ocultar resumen si está vacío
        } else {
            if (emptyMessage) emptyMessage.style.display = 'none';
            if (cartSummary) cartSummary.style.display = 'block'; // Mostrar resumen si hay productos
        }
    }
}

// --- Lógica principal al cargar el DOM ---
document.addEventListener('DOMContentLoaded', function() {
    // 1. Actualizar contador del carrito al cargar cualquier página
    updateCartCounter();

    // 2. Manejar clics en los botones de cantidad en los productos de 'home.html'
    document.querySelectorAll('.product-card .quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const container = this.closest('.quantity-controls');
            const valueElement = container.querySelector('.quantity-value');
            let value = parseInt(valueElement.textContent);
            
            if (this.classList.contains('minus')) {
                if (value > 1) value--;
            } else {
                value++;
            }
            valueElement.textContent = value;
        });
    });
    
    // 3. Manejar agregar al carrito desde 'home.html'
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productId = productCard.dataset.id;
            const productTitle = productCard.querySelector('.product-title').textContent;
            const productPrice = productCard.querySelector('.product-price').textContent; // "$12.99"
            const productImage = productCard.querySelector('.product-image').src;
            const quantity = parseInt(productCard.querySelector('.quantity-value').textContent);

            const existingItem = cart.find(item => item.id == productId); // Usar '==' para comparar string con number si ID es number

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    id: productId,
                    title: productTitle,
                    price: productPrice, // Guardamos el precio como string "$12.99" por ahora
                    image: productImage,
                    quantity: quantity
                });
            }
            
            updateCart(); // Guarda en localStorage y actualiza contador
            alert(`${quantity} ${productTitle} agregado(s) al carrito`);

            // Después de añadir, resetea la cantidad seleccionada en la tarjeta de producto a 1
            productCard.querySelector('.quantity-value').textContent = '1';
        });
    });

    // 4. Renderizar los productos del carrito en 'cart.html' (Esta función se llama desde el script de cart.html)
    window.renderCartItems = function() {
        const cartItemsList = document.getElementById('cart-items-list');
        if (!cartItemsList) return; // Salir si no estamos en la página del carrito

        cartItemsList.innerHTML = ''; // Limpiar la lista actual
        
        if (cart.length === 0) {
            updateCartTotal(); // Asegurar que el mensaje de vacío se muestre
            return;
        }

        cart.forEach(item => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.dataset.id = item.id; // Para identificar el producto al eliminar/actualizar

            const itemPriceNumber = parseFloat(item.price.replace('$', ''));
            const itemSubtotal = (itemPriceNumber * item.quantity).toFixed(2);

            cartItemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <p class="cart-item-price">${item.price}</p>
                    <div class="quantity-controls">
                        <button class="quantity-btn minus">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn plus">+</button>
                    </div>
                    <p class="cart-item-subtotal">Subtotal: $${itemSubtotal}</p>
                </div>
                <button class="remove-item"><i class="fas fa-trash-alt"></i></button>
            `;
            cartItemsList.appendChild(cartItemDiv);
        });

        // Vuelve a adjuntar los event listeners para los botones de cantidad y eliminar
        // Esto es necesario porque los elementos se crearon dinámicamente
        attachCartItemEventListeners();
    };

    // 5. Adjuntar Event Listeners para elementos del carrito (cuando se renderizan dinámicamente)
    function attachCartItemEventListeners() {
        // Para botones de cantidad en el carrito
        document.querySelectorAll('.cart-item .quantity-btn').forEach(button => {
            // Es buena práctica remover listeners antes de añadir para evitar duplicados si la función se llama múltiples veces
            button.removeEventListener('click', handleQuantityChangeInCart); 
            button.addEventListener('click', handleQuantityChangeInCart);
        });

        // Para botones de eliminar
        document.querySelectorAll('.remove-item').forEach(button => {
            button.removeEventListener('click', handleRemoveItem);
            button.addEventListener('click', handleRemoveItem);
        });
    }

    // Función para manejar el cambio de cantidad en el carrito
    function handleQuantityChangeInCart() {
        const container = this.closest('.quantity-controls');
        const valueElement = container.querySelector('.quantity-value');
        let value = parseInt(valueElement.textContent);
        
        if (this.classList.contains('minus')) {
            if (value > 1) value--;
        } else {
            value++;
        }
        
        valueElement.textContent = value; // Actualiza el número en el DOM

        const cartItemDiv = this.closest('.cart-item');
        const productId = cartItemDiv.dataset.id;
        const itemToUpdate = cart.find(item => item.id == productId);

        if (itemToUpdate) {
            itemToUpdate.quantity = value;
            updateCart(); // Guarda en localStorage y actualiza contador
            updateCartTotal(); // Actualiza el total general

            // Actualizar el subtotal del item específico en el DOM
            const itemPriceNumber = parseFloat(itemToUpdate.price.replace('$', ''));
            const newSubtotal = (itemPriceNumber * itemToUpdate.quantity).toFixed(2);
            cartItemDiv.querySelector('.cart-item-subtotal').textContent = `Subtotal: $${newSubtotal}`;
        }
    }

    // Función para manejar la eliminación de un artículo
    function handleRemoveItem() {
        const cartItemDiv = this.closest('.cart-item');
        const productId = cartItemDiv.dataset.id;
        
        cart = cart.filter(item => item.id !== productId); // Filtrar el item a eliminar
        
        updateCart(); // Guardar en localStorage y actualizar contador
        cartItemDiv.remove(); // Eliminar el elemento HTML del DOM
        updateCartTotal(); // Recalcular y mostrar el total (también manejará el mensaje de vacío)
    }

    // --- Lógica del botón de PROCEDER AL PAGO (ejemplo) ---
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                alert('Procediendo al pago... (Funcionalidad de pago no implementada)');
                // Aquí podrías redirigir a una página de pago o iniciar un proceso de checkout
                // Por ejemplo: window.location.href = 'checkout.html';
                // O limpiar el carrito después de un pago exitoso:
                // cart = [];
                // updateCart();
                // renderCartItems();
            } else {
                alert('Tu carrito está vacío. Agrega productos antes de proceder al pago.');
            }
        });
    }

    // Asegurar que la verificación de autenticación redirija si no está logueado en cualquier página.
    // Esto se deja en cada HTML como lo tenías, ya que es específico de cada página al cargar.
});

