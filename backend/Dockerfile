# Usa PHP 8.2 con Apache
FROM php:8.2-apache

# Información del mantenedor
LABEL maintainer="startgg-manager"

# Instala dependencias del sistema y extensiones de PHP requeridas por Laravel
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instala Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configura el directorio de trabajo
WORKDIR /var/www/html

# Copia los archivos de dependencias primero (mejor caché de Docker)
COPY composer.json composer.lock ./

# Instala las dependencias de PHP (sin dev)
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader --no-interaction

# Copia el resto de la aplicación
COPY . .

# Genera el autoloader optimizado
RUN composer dump-autoload --optimize --no-dev

# Configura permisos
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Crea el enlace simbólico de storage (si no existe)
RUN php artisan storage:link || true

# Optimiza Laravel para producción
RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

# Configura Apache para Laravel
RUN a2enmod rewrite
COPY docker/apache-config.conf /etc/apache2/sites-available/000-default.conf

# Expone el puerto 8080 (requerido por AWS App Runner)
EXPOSE 8080

# Configura Apache para escuchar en el puerto 8080
RUN sed -i 's/80/8080/g' /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf

# Inicia Apache en primer plano
CMD ["apache2-foreground"]

