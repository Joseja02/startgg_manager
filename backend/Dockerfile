# Imagen base con PHP 8.2 y Apache
FROM php:8.2-apache

# Instala dependencias del sistema y extensiones de PHP
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_pgsql pgsql mbstring exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instala Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configura el directorio de trabajo
WORKDIR /var/www/html

# Copia los archivos de dependencias
COPY composer.json composer.lock ./

# Instala las dependencias de PHP
RUN composer install --no-dev --no-scripts --no-autoloader --optimize-autoloader --no-interaction

# Copia el resto de la aplicación
COPY . .

# Genera el autoloader optimizado
RUN composer dump-autoload --optimize --no-dev

# Configura permisos
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

# Crea el enlace simbólico de storage
RUN php artisan storage:link || true

# Configura Apache para Laravel
RUN a2enmod rewrite

# Crea configuración de Apache
RUN echo '<VirtualHost *:__PORT__>\n\
    ServerAdmin webmaster@localhost\n\
    DocumentRoot /var/www/html/public\n\
    <Directory /var/www/html/public>\n\
        Options Indexes FollowSymLinks\n\
        AllowOverride All\n\
        Require all granted\n\
    </Directory>\n\
    ErrorLog ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# Script para configurar el puerto, ejecutar migraciones e iniciar Apache
RUN echo '#!/bin/bash\n\
set -e\n\
PORT="${PORT:-8000}"\n\
echo "Configurando puerto..."\n\
printf "Listen %s\n" "$PORT" > /etc/apache2/ports.conf\n\
sed -i "s/__PORT__/$PORT/g" /etc/apache2/sites-available/000-default.conf\n\
echo "Ejecutando migraciones..."\n\
php artisan migrate --force\n\
echo "Iniciando Apache..."\n\
exec apache2-foreground' > /start.sh && chmod +x /start.sh

# Expone el puerto
EXPOSE $PORT

# Inicia Apache
CMD ["/start.sh"]

