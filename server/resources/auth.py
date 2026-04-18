import re
from flask import session
from flask_restful import Resource, reqparse
from models import db, User
from utils import error_response


# --- Request Parsers ---

registration_parser = reqparse.RequestParser()
registration_parser.add_argument(
    "name", type=str, required=True, help="Full name is required"
)
registration_parser.add_argument(
    "email", type=str, required=True, help="Email is required"
)
registration_parser.add_argument(
    "password", type=str, required=True, help="Password is required"
)
registration_parser.add_argument(
    "confirmPassword", type=str, required=True, help="Password confirmation is required"
)

login_parser = reqparse.RequestParser()
login_parser.add_argument("email", type=str, required=True, help="Email is required")
login_parser.add_argument(
    "password", type=str, required=True, help="Password is required"
)


# --- Validation Helpers ---


def validate_email(email):
    """Basic email format validation."""
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return re.match(pattern, email) is not None


def validate_password(password):
    """
    Mirrors the client-side Zod schema:
    - At least 8 characters
    - Contains a special character (@*,.%#^&)
    - Contains a digit
    - Contains a lowercase letter
    - Contains an uppercase letter
    """
    errors = []
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    if not re.search(r"[@\*,\.%#\^&]", password):
        errors.append("Password must contain a special character")
    if not re.search(r"[0-9]", password):
        errors.append("Password must contain a digit")
    if not re.search(r"[a-z]", password):
        errors.append("Password must contain a lowercase letter")
    if not re.search(r"[A-Z]", password):
        errors.append("Password must contain an uppercase letter")
    return errors


def validate_name(name):
    """
    Mirrors the client-side Zod schema:
    - Must contain at least a first and last name (two non-whitespace tokens)
    """
    if not re.match(r"\S+\s\S+", name):
        return "Please enter your first and last names"
    return None


# --- API Resources ---


class UserRegistrationAPI(Resource):
    def post(self):
        """
        Register a new user
        ---
        tags:
          - Authentication
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - name
                - email
                - password
                - confirmPassword
              properties:
                name:
                  type: string
                  example: John Doe
                email:
                  type: string
                  example: john@example.com
                password:
                  type: string
                  example: Passw0rd@
                confirmPassword:
                  type: string
                  example: Passw0rd@
        responses:
          201:
            description: User registered successfully
          400:
            description: Validation error
          409:
            description: Email already registered
        """
        args = registration_parser.parse_args()

        # --- Validation (mirrors client-side Zod schema) ---

        # Validate name format
        name_error = validate_name(args["name"])
        if name_error:
            return error_response(400, name_error)

        # Validate email format
        if not validate_email(args["email"]):
            return error_response(400, "Invalid email format")

        # Validate password strength
        password_errors = validate_password(args["password"])
        if password_errors:
            return error_response(400, "Password validation failed", password_errors)

        # Validate passwords match
        if args["password"] != args["confirmPassword"]:
            return error_response(400, "Passwords do not match")

        # Check for duplicate email
        existing_user = User.query.filter_by(email=args["email"]).first()
        if existing_user:
            return error_response(409, "An account with this email already exists")

        # --- Create User ---
        user = User(name=args["name"], email=args["email"])
        user.set_password(args["password"])

        db.session.add(user)
        db.session.commit()

        return {
            "message": "User registered successfully",
            "user": user.to_dict(),
        }, 201


class UserLoginAPI(Resource):
    def post(self):
        """
        Authenticate a user
        ---
        tags:
          - Authentication
        parameters:
          - in: body
            name: body
            required: true
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  example: john@example.com
                password:
                  type: string
                  example: Passw0rd@
        responses:
          200:
            description: Login successful
          400:
            description: Validation error
          401:
            description: Invalid credentials
        """
        args = login_parser.parse_args()

        # --- Validation (mirrors client-side Zod schema) ---

        # Validate email format
        if not validate_email(args["email"]):
            return error_response(400, "Invalid email format")

        # Validate password length
        if len(args["password"]) < 8:
            return error_response(400, "Password must be at least 8 characters")

        # --- Authenticate ---
        user = User.query.filter_by(email=args["email"]).first()

        if not user or not user.check_password(args["password"]):
            return error_response(401, "Invalid email or password")

        # Store user info in session
        session["user"] = user.to_dict()

        return {
            "success": True,
            "message": "Login successful",
            "user": user.to_dict(),
        }, 200


class UserLogoutAPI(Resource):
    def post(self):
        """
        Log out the current user
        ---
        tags:
          - Authentication
        responses:
          200:
            description: Logged out successfully
          401:
            description: No active session
        """
        if "user" not in session:
            return error_response(401, "No active session")

        session.clear()
        return {"message": "Logged out successfully"}, 200
