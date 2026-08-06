-- =============================================================================
-- ERP-1 · PostgreSQL Schema
-- Versión: 1.0.0
-- Descripción: Sistema ERP para PYMES — Diseño normalizado (3FN)
-- Motor: PostgreSQL 16+
-- =============================================================================

-- =============================================================================
-- EXTENSIONES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- crypt() para JWT si es necesario
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Búsqueda difusa (trigramas)

-- =============================================================================
-- ESQUEMA
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS erp;
SET search_path TO erp, public;

-- =============================================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNCIÓN: Auditoría automática (INSERT/UPDATE/DELETE)
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_action    VARCHAR(50);
    v_old_data  JSONB;
    v_new_data  JSONB;
    v_user_id   UUID;
BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;

    IF TG_OP = 'INSERT' THEN
        v_action := 'created';
        v_new_data := to_jsonb(NEW);
        v_old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'updated';
        v_new_data := to_jsonb(NEW);
        v_old_data := to_jsonb(OLD);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'deleted';
        v_new_data := NULL;
        v_old_data := to_jsonb(OLD);
    END IF;

    INSERT INTO erp.audit_logs (
        company_id, user_id, action, module, table_name,
        reference_id, old_data, new_data
    ) VALUES (
        COALESCE(NEW.company_id, OLD.company_id),
        v_user_id,
        v_action,
        TG_TABLE_NAME,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_old_data,
        v_new_data
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLA 1: companies
-- Propósito: Multitenencia. Cada registro es una empresa cliente del ERP.
-- Normalización: 3FN. No hay dependencias transitivas.
-- =============================================================================
CREATE TABLE companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    legal_name      VARCHAR(255),                           -- Razón social (opcional si difiere)
    tax_id          VARCHAR(50) NOT NULL,                    -- RUC / NIT / EIN
    tax_id_type     VARCHAR(20) DEFAULT 'RUC',               -- RUC, CI, NIT, EIN
    logo_url        TEXT,
    website         VARCHAR(500),
    phone           VARCHAR(50),
    email           VARCHAR(255),
    address         TEXT,
    city            VARCHAR(150),
    state           VARCHAR(150),
    country         VARCHAR(100) DEFAULT 'Paraguay',
    currency_code   VARCHAR(3) DEFAULT 'PYG',                -- ISO 4217
    timezone        VARCHAR(50) DEFAULT 'America/Asuncion',
    fiscal_year_start DATE,                                  -- Inicio del año fiscal
    is_active       BOOLEAN NOT NULL DEFAULT true,
    config          JSONB DEFAULT '{}',                      -- Configuración específica
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_companies_tax_id ON companies(tax_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_name ON companies USING gin (name gin_trgm_ops);
CREATE INDEX idx_companies_is_active ON companies(is_active);

COMMENT ON TABLE companies IS 'Empresas inquilinas del sistema (multitenencia)';
COMMENT ON COLUMN companies.tax_id IS 'RUC (Paraguay), NIT (Colombia), RFC (México), etc.';
COMMENT ON COLUMN companies.config IS 'Configuración JSON: formatos de factura, numeración, impuestos';

-- =============================================================================
-- TABLA 2: sucursales
-- Propósito: Una empresa puede tener múltiples sucursales (depósitos, tiendas).
-- Normalización: Dependencia funcional de companies.
-- =============================================================================
CREATE TABLE sucursales (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    code            VARCHAR(20) NOT NULL,                    -- Código interno: SUC-001
    name            VARCHAR(200) NOT NULL,
    address         TEXT,
    phone           VARCHAR(50),
    email           VARCHAR(255),
    is_headquarters BOOLEAN NOT NULL DEFAULT false,          -- Casa matriz
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_sucursales_code ON sucursales(company_id, code) WHERE deleted_at IS NULL;
CREATE INDEX idx_sucursales_company ON sucursales(company_id);

COMMENT ON TABLE sucursales IS 'Sucursales o puntos de venta de la empresa';

-- =============================================================================
-- TABLA 3: warehouses
-- Propósito: Almacenes físicos donde se guarda el inventario.
-- Normalización: Pertenece a una sucursal.
-- =============================================================================
CREATE TABLE warehouses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sucursal_id     UUID REFERENCES sucursales(id) ON DELETE RESTRICT,
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    location        TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_warehouses_code ON warehouses(company_id, code) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_sucursal ON warehouses(sucursal_id);
CREATE INDEX idx_warehouses_company ON warehouses(company_id);

COMMENT ON TABLE warehouses IS 'Almacenes físicos. Una sucursal puede tener N almacenes.';

-- =============================================================================
-- TABLA 4: roles
-- Propósito: Definición de roles del sistema (Admin, Vendedor, etc.)
-- Normalización: Dependiente de company (cada empresa tiene sus roles).
-- =============================================================================
CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,                   -- admin, manager, seller, etc.
    display_name    VARCHAR(150) NOT NULL,
    description     TEXT,
    level           INT NOT NULL DEFAULT 0,                  -- Nivel jerárquico (5=admin, 1=lectura)
    is_system       BOOLEAN NOT NULL DEFAULT false,          -- false = editable por el usuario
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_roles_name_company ON roles(company_id, name) WHERE deleted_at IS NULL;
CREATE INDEX idx_roles_company ON roles(company_id);

COMMENT ON TABLE roles IS 'Roles del sistema. is_system evita eliminar roles críticos.';
COMMENT ON COLUMN roles.level IS 'Nivel de jerarquía: Admin=5, Manager=4, Seller=3, Buyer=3, Warehouse=2, Viewer=1';

-- =============================================================================
-- TABLA 5: permissions
-- Propósito: Catálogo de permisos disponibles en el sistema.
-- Normalización: Tabla independiente. No depende de company porque los
--                permisos son fijos (definidos por desarrollo).
-- =============================================================================
CREATE TABLE permissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module          VARCHAR(100) NOT NULL,                   -- sales, purchases, inventory, etc.
    action          VARCHAR(100) NOT NULL,                   -- create, read, update, delete, export
    name            VARCHAR(255) NOT NULL UNIQUE,            -- sales.create, inventory.read
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_permissions_module ON permissions(module);

COMMENT ON TABLE permissions IS 'Catálogo fijo de permisos. Se siembra con seeders.';
COMMENT ON COLUMN permissions.name IS 'Convención: {modulo}.{accion}  ej: sales.create';

-- =============================================================================
-- TABLA 6: role_permissions
-- Propósito: Asignación N:N entre roles y permisos.
-- Normalización: Tabla pivot. Dependencia funcional de roles y permissions.
-- =============================================================================
CREATE TABLE role_permissions (
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Permisos asignados a cada rol';

-- =============================================================================
-- TABLA 7: users
-- Propósito: Usuarios del sistema. Cada usuario pertenece a una empresa.
-- Normalización: Dependiente de company.
-- =============================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sucursal_id     UUID REFERENCES sucursales(id) ON DELETE SET NULL,  -- Sucursal por defecto
    username        VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,                   -- Bcrypt
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(50),
    avatar_url      TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    must_change_password BOOLEAN NOT NULL DEFAULT false,      -- Primer inicio
    last_login_at   TIMESTAMPTZ,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_secret TEXT,                                  -- TOTP secret (encrypted)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID REFERENCES users(id),
    updated_by      UUID REFERENCES users(id),
    deleted_by      UUID REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_users_email_company ON users(company_id, email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username_company ON users(company_id, username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_sucursal ON users(sucursal_id);
CREATE INDEX idx_users_name ON users USING gin (first_name gin_trgm_ops, last_name gin_trgm_ops);

COMMENT ON TABLE users IS 'Usuarios del sistema. Bcrypt para passwords, TOTP opcional para 2FA.';
COMMENT ON COLUMN users.must_change_password IS 'True si es primera vez que ingresa o el admin reseteó su password';

-- =============================================================================
-- TABLA 8: user_roles
-- Propósito: Asignación N:N entre usuarios y roles.
-- Normalización: Tabla pivot con dependencias de users y roles.
-- =============================================================================
CREATE TABLE user_roles (
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      UUID,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role ON user_roles(role_id);

COMMENT ON TABLE user_roles IS 'Roles asignados a cada usuario';

-- =============================================================================
-- TABLA 9: refresh_tokens
-- Propósito: Almacenar refresh tokens JWT para rotación segura.
-- Normalización: Dependiente de users.
-- =============================================================================
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,            -- SHA-256 del token
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN NOT NULL DEFAULT false,
    replaced_by     UUID REFERENCES refresh_tokens(id),      -- Token de reemplazo (rotación)
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked = false;

COMMENT ON TABLE refresh_tokens IS 'Refresh tokens con rotación. Al usar uno nuevo, se revoca el anterior.';

-- =============================================================================
-- TABLA 10: password_resets
-- Propósito: Tokens para restablecimiento de contraseña.
-- Normalización: Tabla temporal, se limpia periódicamente.
-- =============================================================================
CREATE TABLE password_resets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used            BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_password_resets_user ON password_resets(user_id);
CREATE INDEX idx_password_resets_token ON password_resets(token_hash);

COMMENT ON TABLE password_resets IS 'Tokens de reseteo de password con expiración (60 min)';

-- =============================================================================
-- TABLA 11: categories
-- Propósito: Jerarquía de categorías para productos.
-- Normalización: Auto-referencia para jerarquía (árbol N:N).
-- =============================================================================
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,  -- NULL = raíz
    code            VARCHAR(20) NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_categories_code_company ON categories(company_id, code) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_company ON categories(company_id);

COMMENT ON TABLE categories IS 'Jerarquía de categorías con auto-referencia (parent_id). Soporta N niveles.';

-- =============================================================================
-- TABLA 12: unit_types
-- Propósito: Catálogo de unidades de medida.
-- Normalización: Tabla catálogo independiente.
-- =============================================================================
CREATE TABLE unit_types (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(20) NOT NULL UNIQUE,             -- unit, kg, l, m, box, hour
    name            VARCHAR(100) NOT NULL,                    -- Unidad, Kilogramo, Litro
    symbol          VARCHAR(10) NOT NULL,                    -- ud, kg, l, m, cja, h
    category        VARCHAR(30) DEFAULT 'unit',              -- unit, weight, volume, length, time
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE unit_types IS 'Unidades de medida. Catálogo del sistema.';

-- =============================================================================
-- TABLA 13: products
-- Propósito: Catálogo de productos/servicios.
-- Normalización: Dependiente de company, category, unit_type.
-- =============================================================================
CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    unit_type_id    UUID NOT NULL REFERENCES unit_types(id),
    sku             VARCHAR(100) NOT NULL,                    -- Stock Keeping Unit
    barcode         VARCHAR(100),                             -- Código de barras EAN-13
    name            VARCHAR(300) NOT NULL,
    description     TEXT,
    product_type    VARCHAR(30) NOT NULL DEFAULT 'product',  -- product, service, combo, kit
    cost_price      DECIMAL(15,4) NOT NULL DEFAULT 0,         -- Precio de costo (promedio ponderado)
    sale_price      DECIMAL(15,4) NOT NULL DEFAULT 0,
    min_stock       DECIMAL(15,4) NOT NULL DEFAULT 0,         -- Stock de seguridad
    max_stock       DECIMAL(15,4) NOT NULL DEFAULT 0,
    current_stock   DECIMAL(15,4) NOT NULL DEFAULT 0,         -- Cache actualizada por trigger
    is_active       BOOLEAN NOT NULL DEFAULT true,
    has_iva         BOOLEAN NOT NULL DEFAULT true,            -- Afecta IVA
    iva_percentage  DECIMAL(5,2) DEFAULT 10.00,               -- % de IVA del producto
    image_url       TEXT,
    weight          DECIMAL(10,2),                            -- Peso en kg
    volume          DECIMAL(10,2),                            -- Volumen en m³
    is_tracked      BOOLEAN NOT NULL DEFAULT true,            -- true = controla stock
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_products_sku_company ON products(company_id, sku) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_name ON products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_active ON products(is_active) WHERE is_active = true AND deleted_at IS NULL;
CREATE INDEX idx_products_low_stock ON products(company_id) WHERE current_stock <= min_stock AND is_tracked = true AND deleted_at IS NULL;

COMMENT ON TABLE products IS 'Productos y servicios. current_stock es cache actualizada por trigger.';
COMMENT ON COLUMN products.cost_price IS 'Costo promedio ponderado calculado automáticamente';
COMMENT ON COLUMN products.is_tracked IS 'Si false, no controla stock (ej: servicios)';

-- =============================================================================
-- TABLA 14: product_images
-- Propósito: Múltiples imágenes por producto.
-- Normalización: 1:N con products (separada para escalabilidad).
-- =============================================================================
CREATE TABLE product_images (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

COMMENT ON TABLE product_images IS 'Galería de imágenes por producto';

-- =============================================================================
-- TABLA 15: customers
-- Propósito: Clientes de la empresa. Unifican personas y empresas.
-- Normalización: Dependiente de company.
-- =============================================================================
CREATE TABLE customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type   VARCHAR(20) NOT NULL DEFAULT 'CI',        -- CI, RUC, Passport, ForeignID
    document_number VARCHAR(50) NOT NULL,
    business_name   VARCHAR(300),                              -- Razón social (persona jurídica)
    first_name      VARCHAR(100),                              -- Persona física
    last_name       VARCHAR(100),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    mobile          VARCHAR(50),
    address         TEXT,
    city            VARCHAR(150),
    state           VARCHAR(150),
    country         VARCHAR(100) DEFAULT 'Paraguay',
    birth_date      DATE,
    credit_limit    DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_credit_hold  BOOLEAN NOT NULL DEFAULT false,            -- Bloqueado por mora
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_customers_document_company ON customers(company_id, document_type, document_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers USING gin (business_name gin_trgm_ops, first_name gin_trgm_ops, last_name gin_trgm_ops);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_customers_credit ON customers(credit_limit, is_credit_hold);

COMMENT ON TABLE customers IS 'Clientes. Persona física (first_name, last_name) o jurídica (business_name).';

-- =============================================================================
-- TABLA 16: suppliers
-- Propósito: Proveedores. Estructura similar a customers pero semántica diferente.
-- Normalización: Tabla separada por contexto de negocio (compras vs ventas).
-- =============================================================================
CREATE TABLE suppliers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    document_type   VARCHAR(20) NOT NULL DEFAULT 'RUC',
    document_number VARCHAR(50) NOT NULL,
    business_name   VARCHAR(300) NOT NULL,
    contact_name    VARCHAR(200),
    email           VARCHAR(255),
    phone           VARCHAR(50),
    mobile          VARCHAR(50),
    address         TEXT,
    city            VARCHAR(150),
    state           VARCHAR(150),
    country         VARCHAR(100) DEFAULT 'Paraguay',
    payment_terms   VARCHAR(100),                              -- 30 días, contado, etc.
    credit_days     INT DEFAULT 0,                            -- Días de crédito
    notes           TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_suppliers_document_company ON suppliers(company_id, document_type, document_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_suppliers_name ON suppliers USING gin (business_name gin_trgm_ops);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);

COMMENT ON TABLE suppliers IS 'Proveedores. Separado de customers para mantener integridad semántica.';

-- =============================================================================
-- TABLA 17: sales
-- Propósito: Cabecera de ventas (facturas, cotizaciones, notas de crédito/débito).
-- Normalización: Dependiente de company, customer, user, sucursal.
-- =============================================================================
CREATE TABLE sales (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id),
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    user_id         UUID NOT NULL REFERENCES users(id),       -- Vendedor que creó la venta
    document_type   VARCHAR(30) NOT NULL DEFAULT 'invoice',   -- invoice, quote, credit_note, debit_note, proforma
    document_serie  VARCHAR(20) NOT NULL,                     -- 001-001 (sucursal-timbrado)
    document_number VARCHAR(50) NOT NULL,                     -- 0000001 (correlativo por serie)
    issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE,                                     -- Fecha de vencimiento
    payment_term    VARCHAR(100),                              -- Contado, 30 días, etc.
    currency_code   VARCHAR(3) NOT NULL DEFAULT 'PYG',
    exchange_rate   DECIMAL(10,6) NOT NULL DEFAULT 1,
    subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax             DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount        DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_type   VARCHAR(20) DEFAULT 'percentage',          -- percentage, fixed
    discount_rate   DECIMAL(5,2) DEFAULT 0,                   -- % de descuento
    total           DECIMAL(15,2) NOT NULL DEFAULT 0,
    status          VARCHAR(30) NOT NULL DEFAULT 'draft',     -- draft, confirmed, invoiced, cancelled
    notes           TEXT,
    internal_notes  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_sales_document ON sales(company_id, document_serie, document_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_date ON sales(issue_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_company ON sales(company_id);
CREATE INDEX idx_sales_sucursal ON sales(sucursal_id);
CREATE INDEX idx_sales_due_date ON sales(due_date) WHERE status NOT IN ('cancelled', 'draft');

COMMENT ON TABLE sales IS 'Cabecera de documentos de venta. document_type define el tipo de documento.';
COMMENT ON COLUMN sales.document_serie IS 'Serie: 001-001 (establecimiento-expedición según SET Paraguay)';
COMMENT ON COLUMN sales.status IS 'Estados: draft (borrador), confirmed (confirmado), invoiced (facturado), cancelled (anulado)';

-- =============================================================================
-- TABLA 18: sale_items
-- Propósito: Detalle de cada línea de venta.
-- Normalización: Dependiente de sales y products.
-- =============================================================================
CREATE TABLE sale_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    line_number     INT NOT NULL,                              -- Número de línea
    description     TEXT,                                      -- Descripción custom (puede diferir del producto)
    quantity        DECIMAL(15,4) NOT NULL,
    unit_type_id    UUID REFERENCES unit_types(id),
    unit_price      DECIMAL(15,4) NOT NULL,
    discount        DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_type   VARCHAR(20) DEFAULT 'percentage',
    discount_rate   DECIMAL(5,2) DEFAULT 0,
    tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    subtotal        DECIMAL(15,2) NOT NULL,                    -- quantity * unit_price
    tax             DECIMAL(15,2) NOT NULL DEFAULT 0,
    total           DECIMAL(15,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);

COMMENT ON TABLE sale_items IS 'Detalle de cada línea en el documento de venta';
COMMENT ON COLUMN sale_items.unit_price IS 'Precio unitario en la moneda del documento';

-- =============================================================================
-- TABLA 19: purchases
-- Propósito: Cabecera de compras (órdenes, recepciones, devoluciones).
-- Normalización: Dependiente de company, supplier, user.
-- =============================================================================
CREATE TABLE purchases (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id),
    supplier_id     UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    user_id         UUID NOT NULL REFERENCES users(id),       -- Usuario que crea la OC
    document_type   VARCHAR(30) NOT NULL DEFAULT 'purchase_order', -- purchase_order, receipt, return
    document_serie  VARCHAR(20) NOT NULL,
    document_number VARCHAR(50) NOT NULL,
    order_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_date   DATE,                                      -- Fecha esperada de recepción
    currency_code   VARCHAR(3) NOT NULL DEFAULT 'PYG',
    exchange_rate   DECIMAL(10,6) NOT NULL DEFAULT 1,
    subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax             DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount        DECIMAL(15,2) NOT NULL DEFAULT 0,
    total           DECIMAL(15,2) NOT NULL DEFAULT 0,
    status          VARCHAR(30) NOT NULL DEFAULT 'draft',      -- draft, pending_approval, approved, sent, partial, completed, cancelled
    notes           TEXT,
    internal_notes  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_purchases_document ON purchases(company_id, document_serie, document_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_user ON purchases(user_id);
CREATE INDEX idx_purchases_date ON purchases(order_date);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_company ON purchases(company_id);

COMMENT ON TABLE purchases IS 'Cabecera de documentos de compra';

-- =============================================================================
-- TABLA 20: purchase_items
-- Propósito: Detalle de cada línea de compra.
-- Normalización: Dependiente de purchases y products.
-- =============================================================================
CREATE TABLE purchase_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id     UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    line_number     INT NOT NULL,
    description     TEXT,
    quantity        DECIMAL(15,4) NOT NULL,
    received_qty    DECIMAL(15,4) NOT NULL DEFAULT 0,           -- Cantidad recibida (soporta recepción parcial)
    unit_type_id    UUID REFERENCES unit_types(id),
    unit_cost       DECIMAL(15,4) NOT NULL,                     -- Costo unitario en la moneda del documento
    discount        DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate        DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    subtotal        DECIMAL(15,2) NOT NULL,
    tax             DECIMAL(15,2) NOT NULL DEFAULT 0,
    total           DECIMAL(15,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product ON purchase_items(product_id);

COMMENT ON TABLE purchase_items IS 'Detalle de cada línea en el documento de compra';
COMMENT ON COLUMN purchase_items.received_qty IS 'Soporta recepción parcial. Se actualiza al recibir mercancía.';

-- =============================================================================
-- TABLA 21: inventory_movements
-- Propósito: Registro de auditoría de todos los movimientos de stock.
-- Normalización: Tabla de hechos. Dependiente de products, warehouses, users.
-- =============================================================================
CREATE TABLE inventory_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    product_id      UUID NOT NULL REFERENCES products(id),
    warehouse_id    UUID REFERENCES warehouses(id),
    movement_type   VARCHAR(30) NOT NULL,                       -- sale, purchase, adjustment, transfer_in, transfer_out, initial, return
    reference_type  VARCHAR(50),                                -- sales, purchases, adjustments
    reference_id    UUID,                                       -- ID del documento que originó el movimiento
    quantity        DECIMAL(15,4) NOT NULL,                     -- Positivo = entrada, Negativo = salida
    unit_cost       DECIMAL(15,4),                              -- Costo unitario al momento del movimiento
    total_cost      DECIMAL(15,2),                              -- quantity * unit_cost
    stock_before    DECIMAL(15,4),                              -- Stock antes del movimiento
    stock_after     DECIMAL(15,4),                              -- Stock después del movimiento
    notes           TEXT,
    user_id         UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at);
CREATE INDEX idx_inventory_movements_company ON inventory_movements(company_id);

COMMENT ON TABLE inventory_movements IS 'Registro inmutable de cada movimiento de inventario. Tabla de auditoría de stock.';
COMMENT ON COLUMN inventory_movements.quantity IS 'Convención: entrada = positivo, salida = negativo';
COMMENT ON COLUMN inventory_movements.stock_before IS 'Cache del stock previo para trazabilidad';

-- =============================================================================
-- TRIGGER: Actualizar current_stock en products después de cada movimiento
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE erp.products
    SET current_stock = current_stock + NEW.quantity,
        cost_price = CASE
            WHEN NEW.movement_type = 'purchase' AND NEW.quantity > 0
                THEN (cost_price * (current_stock - NEW.quantity) + NEW.total_cost) / current_stock
            ELSE cost_price
        END
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_movements_after_insert
    AFTER INSERT ON inventory_movements
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_product_stock();

-- =============================================================================
-- TABLA 22: invoices
-- Propósito: Documentos fiscales de facturación (separado de sales para
--            soportar facturación electrónica y regímenes fiscales complejos).
-- Normalización: 1:1 con sales (una venta = una factura).
-- =============================================================================
CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sale_id         UUID NOT NULL REFERENCES sales(id) ON DELETE RESTRICT,
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id),
    customer_id     UUID NOT NULL REFERENCES customers(id),
    invoice_type    VARCHAR(30) NOT NULL DEFAULT 'standard',   -- standard, credit_note, debit_note, export
    tin             VARCHAR(50) NOT NULL,                       -- Número de timbrado (Paraguay) / CAE (Argentina)
    invoice_number  VARCHAR(50) NOT NULL,                      -- Número de factura completo
    serie           VARCHAR(20) NOT NULL,
    issue_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date        DATE,
    subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_base        DECIMAL(15,2) NOT NULL DEFAULT 0,           -- Base imponible
    tax             DECIMAL(15,2) NOT NULL DEFAULT 0,
    iva_10          DECIMAL(15,2) DEFAULT 0,                   -- IVA 10%
    iva_5           DECIMAL(15,2) DEFAULT 0,                   -- IVA 5%
    iva_exempt      DECIMAL(15,2) DEFAULT 0,                   -- Exento
    discount        DECIMAL(15,2) NOT NULL DEFAULT 0,
    total           DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency_code   VARCHAR(3) NOT NULL DEFAULT 'PYG',
    exchange_rate   DECIMAL(10,6) NOT NULL DEFAULT 1,
    qr_data         TEXT,                                       -- Código QR de factura electrónica
    electronic_key  VARCHAR(255),                               -- CDC (Paraguay) / CAE (Argentina)
    is_electronic   BOOLEAN NOT NULL DEFAULT false,
    status          VARCHAR(30) NOT NULL DEFAULT 'pending',     -- pending, sent, accepted, rejected, cancelled
    cancellation_reason TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_invoices_number ON invoices(company_id, invoice_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_invoices_sale ON invoices(sale_id);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(issue_date);
CREATE INDEX idx_invoices_status ON invoices(status);

COMMENT ON TABLE invoices IS 'Facturas fiscales. Separadas de sales para cumplimiento tributario.';
COMMENT ON COLUMN invoices.tin IS 'Timbrado (Paraguay), CAE (Argentina), Folio (Chile)';
COMMENT ON COLUMN invoices.electronic_key IS 'CDC (Código de Control) para factura electrónica en Paraguay';
COMMENT ON COLUMN invoices.status IS 'Estado fiscal: pending, sent (enviado a SET), accepted, rejected, cancelled';

-- =============================================================================
-- TABLA 23: invoice_items
-- Propósito: Detalle fiscal de cada línea de factura.
-- Normalización: Dependiente de invoices.
-- =============================================================================
CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id),
    line_number     INT NOT NULL,
    description     TEXT NOT NULL,
    quantity        DECIMAL(15,4) NOT NULL,
    unit_type       VARCHAR(20) NOT NULL DEFAULT 'unit',
    unit_price      DECIMAL(15,4) NOT NULL,
    iva_type        VARCHAR(20) NOT NULL DEFAULT '10',          -- 10, 5, exempt
    subtotal        DECIMAL(15,2) NOT NULL,
    tax             DECIMAL(15,2) NOT NULL DEFAULT 0,
    total           DECIMAL(15,2) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

COMMENT ON TABLE invoice_items IS 'Detalle fiscal de cada línea de factura. Puede diferir de sale_items por ajustes fiscales.';

-- =============================================================================
-- TABLA 24: payments
-- Propósito: Registro de pagos recibidos (CxC) o realizados (CxP).
-- Normalización: Polimórfica (reference_type/reference_id) para ventas y compras.
-- =============================================================================
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    payment_type    VARCHAR(20) NOT NULL,                       -- receivable (cobro), payable (pago)
    reference_type  VARCHAR(30) NOT NULL,                       -- sales, purchases
    reference_id    UUID NOT NULL,                              -- ID de la venta o compra
    customer_id     UUID REFERENCES customers(id),              -- Si es cobro
    supplier_id     UUID REFERENCES suppliers(id),              -- Si es pago
    invoice_id      UUID REFERENCES invoices(id),
    amount          DECIMAL(15,2) NOT NULL,
    payment_method  VARCHAR(50) NOT NULL DEFAULT 'cash',        -- cash, bank_transfer, check, credit_card, debit_card, mobile
    payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number VARCHAR(100),                              -- Número de cheque, transferencia, etc.
    bank_account    VARCHAR(100),
    notes           TEXT,
    user_id         UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE INDEX idx_payments_reference ON payments(reference_type, reference_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_supplier ON payments(supplier_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method);
CREATE INDEX idx_payments_company ON payments(company_id);

COMMENT ON TABLE payments IS 'Pagos. Polimórfico: reference_type/reference_id apunta a sales o purchases.';

-- =============================================================================
-- TABLA 25: accounts_chart (Plan de Cuentas Contable)
-- Propósito: Catálogo de cuentas contables (Plan de Cuentas).
-- Normalización: Jerarquía auto-referenciada (parent_id).
-- =============================================================================
CREATE TABLE accounts_chart (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    parent_id       UUID REFERENCES accounts_chart(id) ON DELETE SET NULL,
    code            VARCHAR(20) NOT NULL,                       -- 1.1.1.01 (formato: grupo.subgrupo.cuenta.subcuenta)
    name            VARCHAR(300) NOT NULL,
    type            VARCHAR(30) NOT NULL,                       -- asset, liability, equity, income, expense
    nature          VARCHAR(10) NOT NULL,                       -- debit (deudora), credit (acreedora)
    is_active       BOOLEAN NOT NULL DEFAULT true,
    allow_movements BOOLEAN NOT NULL DEFAULT true,               -- false = cuenta padre (solo agrupadora)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_accounts_chart_code ON accounts_chart(company_id, code) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_chart_parent ON accounts_chart(parent_id);
CREATE INDEX idx_accounts_chart_type ON accounts_chart(type);

COMMENT ON TABLE accounts_chart IS 'Plan de cuentas contable. Jerarquía con parent_id.';
COMMENT ON COLUMN accounts_chart.nature IS 'Naturaleza: debit (deudora = activo/gasto), credit (acreedora = pasivo/ingreso/patrimonio)';

-- =============================================================================
-- TABLA 26: journal_entries
-- Propósito: Cabecera de asientos contables (comprobantes).
-- Normalización: Dependiente de company.
-- =============================================================================
CREATE TABLE journal_entries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_number    VARCHAR(50) NOT NULL,                       -- 1-000001 (correlativo por año)
    description     TEXT NOT NULL,
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_type  VARCHAR(50),                                -- sales, purchases, payments, opening, adjustment, closing
    reference_id    UUID,
    currency_code   VARCHAR(3) NOT NULL DEFAULT 'PYG',
    exchange_rate   DECIMAL(10,6) NOT NULL DEFAULT 1,
    total_debit     DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_credit    DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_balanced     BOOLEAN GENERATED ALWAYS AS (total_debit = total_credit) STORED,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',       -- draft, posted, cancelled
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE UNIQUE INDEX idx_journal_entries_number ON journal_entries(company_id, entry_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_journal_entries_company ON journal_entries(company_id);

COMMENT ON TABLE journal_entries IS 'Cabecera de asientos contables. Debe cumplir: total_debit = total_credit.';

-- =============================================================================
-- TABLA 27: journal_lines
-- Propósito: Detalle de cada línea del asiento contable.
-- Normalización: Dependiente de journal_entries y accounts_chart.
-- =============================================================================
CREATE TABLE journal_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id      UUID NOT NULL REFERENCES accounts_chart(id) ON DELETE RESTRICT,
    line_number     INT NOT NULL,
    description     TEXT,
    debit           DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit          DECIMAL(15,2) NOT NULL DEFAULT 0,
    cost_center     VARCHAR(100),                                -- Centro de costo (opcional)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);
CREATE INDEX idx_journal_lines_cost_center ON journal_lines(cost_center);

COMMENT ON TABLE journal_lines IS 'Líneas del asiento contable. Para cada línea: debit > 0 XOR credit > 0.';
COMMENT ON COLUMN journal_lines.debit IS 'Valor del débito. Debe ser 0 si credit > 0.';
COMMENT ON COLUMN journal_lines.credit IS 'Valor del crédito. Debe ser 0 si debit > 0.';

-- =============================================================================
-- RESTRICCIÓN: Cada línea debe tener débito O crédito, no ambos ni ninguno
-- =============================================================================
ALTER TABLE journal_lines ADD CONSTRAINT chk_journal_lines_debit_credit
    CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0));

-- =============================================================================
-- TABLA 28: caja_sessions
-- Propósito: Apertura y cierre de caja (turno de trabajo).
-- Normalización: Dependiente de company, sucursal, user.
-- =============================================================================
CREATE TABLE caja_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sucursal_id     UUID NOT NULL REFERENCES sucursales(id),
    user_id         UUID NOT NULL REFERENCES users(id),         -- Cajero responsable
    opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    closed_at       TIMESTAMPTZ,
    initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    final_balance   DECIMAL(15,2),                              -- Calculado al cerrar
    expected_balance DECIMAL(15,2),                              -- Debería haber
    difference      DECIMAL(15,2),                              -- final - expected (sobrante/faltante)
    status          VARCHAR(20) NOT NULL DEFAULT 'open',        -- open, closed, reconciled
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMPTZ,
    created_by      UUID,
    updated_by      UUID,
    deleted_by      UUID
);

CREATE INDEX idx_caja_sessions_user ON caja_sessions(user_id);
CREATE INDEX idx_caja_sessions_sucursal ON caja_sessions(sucursal_id);
CREATE INDEX idx_caja_sessions_status ON caja_sessions(status);

COMMENT ON TABLE caja_sessions IS 'Apertura y cierre de caja por turno.';

-- =============================================================================
-- TABLA 29: cash_movements
-- Propósito: Movimientos de efectivo dentro de una sesión de caja.
-- Normalización: Dependiente de caja_sessions.
-- =============================================================================
CREATE TABLE cash_movements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    caja_session_id UUID NOT NULL REFERENCES caja_sessions(id) ON DELETE CASCADE,
    movement_type   VARCHAR(30) NOT NULL,                       -- sale_payment, expense, withdrawal, deposit, purchase_payment
    reference_type  VARCHAR(50),                                -- sales, purchases, expenses
    reference_id    UUID,
    amount          DECIMAL(15,2) NOT NULL,                     -- Positivo = ingreso, Negativo = egreso
    payment_method  VARCHAR(50) NOT NULL DEFAULT 'cash',
    description     TEXT,
    user_id         UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cash_movements_session ON cash_movements(caja_session_id);
CREATE INDEX idx_cash_movements_type ON cash_movements(movement_type);
CREATE INDEX idx_cash_movements_reference ON cash_movements(reference_type, reference_id);

COMMENT ON TABLE cash_movements IS 'Movimientos de efectivo dentro de una sesión de caja.';

-- =============================================================================
-- TABLA 30: audit_logs
-- Propósito: Registro de auditoría para cumplimiento (SOX, PCI, local).
-- Normalización: Tabla de hechos. Almacena cambios en JSONB.
-- =============================================================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id),
    user_id         UUID,
    action          VARCHAR(50) NOT NULL,                       -- created, updated, deleted, exported, login, failed_login
    module          VARCHAR(50) NOT NULL,                        -- Nombre de la tabla o módulo
    table_name      VARCHAR(100),
    reference_id    UUID,                                       -- ID del registro afectado
    old_data        JSONB,                                      -- Datos anteriores (para UPDATE/DELETE)
    new_data        JSONB,                                      -- Datos nuevos (para INSERT/UPDATE)
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_reference ON audit_logs(reference_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_search ON audit_logs USING gin (old_data jsonb_path_ops, new_data jsonb_path_ops);

COMMENT ON TABLE audit_logs IS 'Registro de auditoría completo. Se inserta mediante triggers.';

-- =============================================================================
-- TABLA 31: system_config
-- Propósito: Configuración general del sistema (llave-valor).
-- Normalización: Tabla simple KV. Separada de companies.config para configuraciones globales.
-- =============================================================================
CREATE TABLE system_config (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    key             VARCHAR(100) NOT NULL,
    value           TEXT,
    type            VARCHAR(30) DEFAULT 'string',               -- string, number, boolean, json
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_system_config_key ON system_config(company_id, key);

COMMENT ON TABLE system_config IS 'Configuración del sistema en formato llave-valor.';

-- =============================================================================
-- VISTA 1: v_product_stock
-- Propósito: Vista de stock actual por producto y almacén.
-- =============================================================================
CREATE OR REPLACE VIEW v_product_stock AS
SELECT
    p.id AS product_id,
    p.sku,
    p.name AS product_name,
    p.current_stock,
    p.min_stock,
    p.max_stock,
    p.cost_price,
    p.sale_price,
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    c.name AS category_name,
    CASE
        WHEN p.current_stock <= 0 THEN 'out_of_stock'
        WHEN p.current_stock <= p.min_stock THEN 'low_stock'
        ELSE 'ok'
    END AS stock_status
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
CROSS JOIN warehouses w
WHERE p.deleted_at IS NULL AND w.deleted_at IS NULL;

COMMENT ON VIEW v_product_stock IS 'Vista de stock por producto y almacén con estado.';

-- =============================================================================
-- VISTA 2: v_accounts_receivable
-- Propósito: Cuentas por cobrar (clientes que deben).
-- =============================================================================
CREATE OR REPLACE VIEW v_accounts_receivable AS
SELECT
    s.id AS sale_id,
    s.document_type,
    s.document_serie,
    s.document_number,
    s.issue_date,
    s.due_date,
    s.total,
    COALESCE(SUM(p.amount), 0) AS paid,
    s.total - COALESCE(SUM(p.amount), 0) AS balance,
    c.id AS customer_id,
    c.business_name,
    c.first_name,
    c.last_name,
    CASE
        WHEN s.due_date < CURRENT_DATE AND (s.total - COALESCE(SUM(p.amount), 0)) > 0 THEN 'overdue'
        WHEN (s.total - COALESCE(SUM(p.amount), 0)) <= 0 THEN 'paid'
        ELSE 'pending'
    END AS status
FROM sales s
JOIN customers c ON c.id = s.customer_id
LEFT JOIN payments p ON p.reference_type = 'sales' AND p.reference_id = s.id AND p.deleted_at IS NULL
WHERE s.deleted_at IS NULL AND s.status != 'cancelled'
GROUP BY s.id, c.id;

COMMENT ON VIEW v_accounts_receivable IS 'Cuentas por cobrar (CxC) con saldo pendiente y estado de mora.';

-- =============================================================================
-- VISTA 3: v_accounts_payable
-- Propósito: Cuentas por pagar (proveedores a quienes debemos).
-- =============================================================================
CREATE OR REPLACE VIEW v_accounts_payable AS
SELECT
    p.id AS purchase_id,
    p.document_type,
    p.document_serie,
    p.document_number,
    p.order_date,
    p.expected_date,
    p.total,
    COALESCE(SUM(pm.amount), 0) AS paid,
    p.total - COALESCE(SUM(pm.amount), 0) AS balance,
    s.id AS supplier_id,
    s.business_name,
    CASE
        WHEN p.expected_date < CURRENT_DATE AND (p.total - COALESCE(SUM(pm.amount), 0)) > 0 THEN 'overdue'
        WHEN (p.total - COALESCE(SUM(pm.amount), 0)) <= 0 THEN 'paid'
        ELSE 'pending'
    END AS status
FROM purchases p
JOIN suppliers s ON s.id = p.supplier_id
LEFT JOIN payments pm ON pm.reference_type = 'purchases' AND pm.reference_id = p.id AND pm.deleted_at IS NULL
WHERE p.deleted_at IS NULL AND p.status != 'cancelled'
GROUP BY p.id, s.id;

COMMENT ON VIEW v_accounts_payable IS 'Cuentas por pagar (CxP) con saldo pendiente.';

-- =============================================================================
-- VISTA 4: v_profit_loss
-- Propósito: Estado de resultados simplificado.
-- =============================================================================
CREATE OR REPLACE VIEW v_profit_loss AS
SELECT
    je.company_id,
    je.entry_date,
    ac.code,
    ac.name AS account_name,
    ac.type,
    SUM(jl.debit) AS total_debit,
    SUM(jl.credit) AS total_credit,
    SUM(jl.debit - jl.credit) AS balance
FROM journal_entries je
JOIN journal_lines jl ON jl.journal_entry_id = je.id
JOIN accounts_chart ac ON ac.id = jl.account_id
WHERE je.status = 'posted'
GROUP BY je.company_id, je.entry_date, ac.code, ac.name, ac.type;

COMMENT ON VIEW v_profit_loss IS 'Vista de ingresos y gastos para estado de resultados.';

-- =============================================================================
-- TRIGGERS DE AUDITORÍA (solo para tablas críticas)
-- =============================================================================

-- Auditoría para products
CREATE TRIGGER trg_audit_products
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION trigger_audit();

-- Auditoría para sales
CREATE TRIGGER trg_audit_sales
    AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION trigger_audit();

-- Auditoría para purchases
CREATE TRIGGER trg_audit_purchases
    AFTER INSERT OR UPDATE OR DELETE ON purchases
    FOR EACH ROW EXECUTE FUNCTION trigger_audit();

-- Auditoría para customers
CREATE TRIGGER trg_audit_customers
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION trigger_audit();

-- Auditoría para suppliers
CREATE TRIGGER trg_audit_suppliers
    AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION trigger_audit();

-- Auditoría para users
CREATE TRIGGER trg_audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_audit();

-- Auditoría para payments
CREATE TRIGGER trg_audit_payments
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION trigger_audit();

-- =============================================================================
-- TRIGGERS DE updated_at
-- =============================================================================

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_sucursales_updated_at BEFORE UPDATE ON sucursales FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_accounts_chart_updated_at BEFORE UPDATE ON accounts_chart FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_caja_sessions_updated_at BEFORE UPDATE ON caja_sessions FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =============================================================================
-- FIN DEL SCRIPT
-- =============================================================================
