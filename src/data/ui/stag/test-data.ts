// SWAG LABS — UI test data (stag). Credentials are the public demo accounts shown on saucedemo.com's login page.

export const users = {
    standard: { username: 'standard_user', password: 'secret_sauce' },
    locked_out: { username: 'locked_out_user', password: 'secret_sauce' },
    wrong_password: { username: 'standard_user', password: 'not_the_password' },
}

export const login_messages = {
    locked_out: 'Epic sadface: Sorry, this user has been locked out.',
    wrong_credentials: 'Epic sadface: Username and password do not match any user in this service',
    username_required: 'Epic sadface: Username is required',
    password_required: 'Epic sadface: Password is required',
    // %s = the page that was opened without a session
    not_logged_in: "Epic sadface: You can only access '%s' when you are logged in.",
}

// items are located by their displayed name (no index) → names must exist in this environment
export const products = {
    backpack: 'Sauce Labs Backpack',
    bike_light: 'Sauce Labs Bike Light',
    bolt_tshirt: 'Sauce Labs Bolt T-Shirt',
    fleece_jacket: 'Sauce Labs Fleece Jacket',
    catalog_size: 6,
}

export const sort_options = {
    name_asc: 'Name (A to Z)',
    name_desc: 'Name (Z to A)',
    price_asc: 'Price (low to high)',
    price_desc: 'Price (high to low)',
}

export const checkout = {
    customer: { first_name: 'Thuong', last_name: 'Nguyen', postal_code: '700000' },
    tax_rate: 0.08,
    complete_header: 'Thank you for your order!',
    messages: {
        first_name_required: 'Error: First Name is required',
        last_name_required: 'Error: Last Name is required',
        postal_code_required: 'Error: Postal Code is required',
    },
}
