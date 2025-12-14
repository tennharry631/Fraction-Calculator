
import { SecretPhrase } from './types';

export const SECRET_PHRASES: Record<string, SecretPhrase> = {
  'love': { message: 'I love you ❤️' },
  'luv': { message: 'I luv you ❤️' },
  'hello': { message: 'Hello there! 👋' },
  'hi': { message: 'Hi to you too! 👋' },
  'how are you': { message: 'I am fine, thanks 😄' },
  'are you smart': { message: 'Try me 😤' },
  'thanks': { message: 'You are welcome 😄' },
  'thankyou': { message: 'You are welcome 😄' },
  'jaan': { message: 'I love you Jaan ❤️' },
  'kiss': { message: 'A flying kiss to you 😘' },
  'like': { message: 'I love you Jaan 😍' },
  'pyaar': { message: 'I love you too ❤️' },
  'dil': { message: 'Hamara dil aapke paas 😁❤️' },
  'babe': { message: 'I am blushing babe 😊' },
  'bae': { message: 'Stop! I am blushing babe 😊' },
  'baby': { message: 'I am blushing baby 😊' },
  'darling': { message: 'Hello my darling! 🤗' },
  'pumpkin': { message: 'You are my pumkin! 😉' },
  'cute': { message: 'Stop! I am blushing babe 😊😻' },
  'honey': { message: 'My love 😀' },
  'smart': { message: 'I am, Thankyou! 😁🧠' },
  'sharp': { message: 'Just like a knife 😁🔪' },
  'awesome': { message: 'Thank you! 😄' },
  'amazing': { message: 'Glad you think so! ✨' },
  'perfect': { message: 'Appreciate it! 👌' },
  'incredible': { message: 'Appreciate it! 👌' },
  'beautiful': { message: 'Thanks a lot! 🌸' },
  'brilliant': { message: 'Happy to hear that! 💡' },
  'fantastic': { message: 'That means a lot! 🌟' },
  'impressive': { message: 'Thanks for noticing! 🔥' },
  'nice': { message: 'Thanks, glad you think so! 🙂' },
  'lovely': { message: 'Very kind, thanks! 💖' },
  'great': { message: 'Appreciate it! 👍' },
  'cool': { message: 'Glad you like it! 😎' },
  'wonderful': { message: 'Thanks for the kind words! 🌈' },
  'excellent': { message: 'Thank you! 🏆' },
  'superb': { message: 'Honored, thanks! 🎯' },
  'good': { message: 'Thanks, I worked hard! 💪' },
  'work': { message: 'Happy you liked it! 😄' },
  'job': { message: 'Happy you liked it! 😄' },
  'welldone': { message: 'Thank you so much! 👏' },
  'effort': { message: 'Happy it shows! 🚀' },
  'well': { message: 'Thanks, truly! 👏' },
  'talent': { message: 'Thank you! 🎭' },
  'creative': { message: 'I appreciate that! 🎨' },
  'helpful': { message: 'Happy to help! 🤝' },
  'debugshow': { message: 'Debug Mode Enabled 🐞' },
};

export const PRECISION_OPTIONS = [
  { value: 16, label: '1/16"' },
  { value: 32, label: '1/32"' },
  { value: 64, label: '1/64"' },
  { value: 128, label: '1/128"' },
];

export const OUTPUT_UNITS = [
  { value: 'Feet-In', label: 'Feet & Inches' },
  { value: 'Inch', label: 'Inches' },
  { value: 'Feet', label: 'Feet (Decimal)' },
  { value: 'Meter', label: 'Meters' },
  { value: 'Centimeter', label: 'Centimeters' },
  { value: 'Millimeter', label: 'Millimeters' },
];

export const PYTHON_CALCULATOR_SCRIPT = `
from fractions import Fraction
import re
import ast

UNITS = {
    "Meter": 1.0,
    "Centimeter": 0.01,
    "Millimeter": 0.001,
    "Inch": 0.0254,
    "Feet": 0.3048,
    "Feet-In": 0.0254
}

debug_steps = []

def log(step):
    global debug_steps
    debug_steps.append(step)

def parse_number(s):
    s = s.strip()
    log(f"Parsing Number: '{s}'")
    if '..' in s or s.count('.') > 1:
        raise ValueError("Invalid number")
    
    # Check for mixed fraction: "1 3/4"
    mixed_match = re.match(r'^(\\d+)\\s+(\\d+)/(\\d+)$', s)
    if mixed_match:
        whole, num, den = map(int, mixed_match.groups())
        log(f"Found Mixed Fraction: {whole} {num}/{den}")
        if den == 0: raise ZeroDivisionError()
        val = float(whole) + float(Fraction(num, den))
        log(f"Value: {val}")
        return val
        
    if '/' in s:
        log(f"Found Fraction: {s}")
        return float(Fraction(s))
        
    if s == '.': return 0.0
    
    val = float(s) if s else 0.0
    log(f"Found Decimal/Int: {val}")
    return val

def parse_token_advanced(token):
    token = token.strip()
    log(f"Parsing Token: '{token}'")
    
    unit_match = re.match(r'^([\\d\\s\\/\\.]+?)([a-zA-Z]+)$', token)
    if unit_match:
        value_str, unit = unit_match.groups()
        log(f"Split Token -> Val: '{value_str}', Unit: '{unit}'")
        value = parse_number(value_str.strip())
        
        unit_lower = unit.lower()
        if unit_lower in ('ft','feet','foot'): unit = 'Feet'
        elif unit_lower in ('in','inch','inches'): unit = 'Inch'
        elif unit_lower in ('m','meter','meters'): unit = 'Meter'
        elif unit_lower in ('cm','centimeter','centimeters'): unit = 'Centimeter'
        elif unit_lower in ('mm','millimeter','millimeters'): unit = 'Millimeter'
        else: raise ValueError(f"Unknown unit: {unit}")
        
        converted_value = value * UNITS[unit]
        log(f"Converted {value} {unit} -> {converted_value} Meters")
        return (converted_value, True)
        
    val = parse_number(token)
    return (val, False)

def preprocess_expression(expr):
    # Fix spaces in fractions: "3/ 8" -> "3/8", "1 / 2" -> "1/2"
    log("Preprocessing: Normalizing fractions...")
    expr = re.sub(r'(\\d+)\\s*/\\s*(\\d+)', r'\\1/\\2', expr)
    log(f"After Fraction Fix: {expr}")

    # Combine split ft/in: "1ft 6in" -> "(1ft+6in)"
    # Support simple fractions (3/8) or decimals (.5) or mixed (1 1/2)
    # The number pattern includes: \\d+ followed optionally by ( /\\d+ OR \\s+\\d+/\\d+ OR \\.\\d+ )
    pattern = r'(\\d+(?:/\\d+|\\s+\\d+/\\d+|\\.\\d+)?(?:ft|feet))\\s*(\\d+(?:/\\d+|\\s+\\d+/\\d+|\\.\\d+)?(?:in|inch))'
    expr = re.sub(pattern, r'(\\1+\\2)', expr, flags=re.IGNORECASE)
    
    # Ensure space between number and unit is handled
    # Also updating number pattern here to be consistent
    expr = re.sub(r'(?i)(\\d+(?:/\\d+|\\s+\\d+/\\d+|\\.\\d+)?)\\s+([a-zA-Z]+)', r'\\1\\2', expr)
    
    log(f"Final Preprocessed: {expr}")
    return expr

def tokenize_advanced(expression):
    pattern = r'(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+\\.\\d+|\\d+)(?:[a-zA-Z]+)?|[\\+\\-\\*\\/\\(\\)]'
    tokens = re.findall(pattern, expression)
    log(f"Tokens: {tokens}")
    return tokens

def check_syntax(expression, tokens):
    # Verify all characters (excluding whitespace) are covered by tokens
    # Using re.finditer to track coverage
    pattern = r'(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+\\.\\d+|\\d+)(?:[a-zA-Z]+)?|[\\+\\-\\*\\/\\(\\)]'
    matches = list(re.finditer(pattern, expression))
    
    last_end = 0
    for m in matches:
        start, end = m.span()
        # content between last match and this match must be whitespace
        skipped = expression[last_end:start]
        if skipped.strip():
            return skipped.strip()
        last_end = end
    
    # Check tail
    skipped = expression[last_end:]
    if skipped.strip():
        return skipped.strip()
    
    return None

def evaluate_advanced(expression, output_unit):
    processed = preprocess_expression(expression)
    tokens = tokenize_advanced(processed)
    
    # Check for invalid characters (e.g., 'rg' in '3inrg')
    bad_chars = check_syntax(processed, tokens)
    if bad_chars:
        raise SyntaxError(f"Unexpected: '{bad_chars}'")

    values, ops = [], []
    
    def apply_op(op, right, left):
        left_val, left_unit = left
        right_val, right_unit = right
        log(f"Operation: {left_val} ({left_unit}) {op} {right_val} ({right_unit})")
        
        if op in ('*','/'):
            if left_unit and right_unit: raise ValueError("Cannot multiply/divide units")
            if op == '/' and right_val == 0: raise ZeroDivisionError()
            res = left_val * right_val if op == '*' else (left_val / right_val)
            return (res, left_unit or right_unit)
        elif op in ('+','-'):
            if left_unit != right_unit: raise ValueError("Unit Mismatch (Internal)")
            res = left_val + right_val if op == '+' else left_val - right_val
            return (res, left_unit)
        return (left_val, left_unit)
    
    precedence = {'+':1, '-':1, '*':2, '/':2}
    i = 0
    while i < len(tokens):
        tok = tokens[i]
        if tok == '(': ops.append(tok)
        elif tok == ')':
            while ops and ops[-1] != '(':
                if len(values) >= 2: values.append(apply_op(ops.pop(), values.pop(), values.pop()))
                else: ops.pop()
            if ops and ops[-1] == '(': ops.pop()
        elif tok in precedence:
            while ops and ops[-1] != '(' and precedence.get(ops[-1],0) >= precedence[tok]:
                if len(values) >= 2: values.append(apply_op(ops.pop(), values.pop(), values.pop()))
                else: break
            ops.append(tok)
        else:
            values.append(parse_token_advanced(tok))
        i += 1
    while ops:
        if len(values) >= 2: values.append(apply_op(ops.pop(), values.pop(), values.pop()))
        else: ops.pop()
        
    if not values: return 0, False, None
    
    # CRITICAL FIX: Ensure all values are consumed.
    # If len(values) > 1, it means we have multiple numbers without operators (e.g. "1ft 3/8")
    if len(values) > 1:
        raise SyntaxError("Missing operator")

    res_val, has_unit = values[0]
    
    log(f"Final Raw Value: {res_val} (Meters), Is Unit: {has_unit}")
    
    if has_unit:
        if output_unit == "Feet-In":
            return res_val / UNITS["Inch"], True, output_unit
        return res_val / UNITS[output_unit], True, output_unit
    return res_val, False, None

def evaluate_basic(expression):
    from fractions import Fraction as _Fraction
    
    # Normalize spaces in fractions first
    expression = re.sub(r'(\\d+)\\s*/\\s*(\\d+)', r'\\1/\\2', expression)
    
    expr = expression.strip().replace('×','*').replace('÷','/').replace('−','-')
    
    # Handle mixed fractions "1 1/2" -> "(1+1/2)"
    expr = re.sub(r'(\\d+)\\s+(\\d+/\\d+)', r'(\\1+\\2)', expr)
    
    log(f"Basic Eval Formula: {expr}")
    
    def frac_repl(m):
        a,b = m.group(0).split('/')
        if int(b) == 0: raise ZeroDivisionError()
        return f'Fraction({a},{b})'
    expr = re.sub(r'\\b\\d+/\\d+\\b', frac_repl, expr)
    
    tree = ast.parse(expr, mode='eval')
    local_env = {'Fraction': _Fraction}
    res = eval(compile(tree, filename="<ast>", mode="eval"), {'__builtins__': None}, local_env)
    return float(res)

def format_mixed(val, denom):
    val = round(val * denom) / denom
    f = Fraction(val).limit_denominator(denom)
    
    if f.denominator == 1: return str(f.numerator)
    whole = int(f.numerator // f.denominator)
    rem = abs(f.numerator) % f.denominator
    if rem == 0: return str(whole)
    if whole == 0: return f"{f.numerator}/{f.denominator}"
    return f"{whole} {rem}/{f.denominator}"

def format_improper(val, denom):
    val = round(val * denom) / denom
    f = Fraction(val).limit_denominator(denom)
    return f"{f.numerator}/{f.denominator}"

def format_ft_in(val_inches, denom):
    val_inches = round(val_inches * denom) / denom
    val = abs(val_inches)
    ft = int(val // 12)
    rem_in = val % 12
    
    f_in = Fraction(rem_in).limit_denominator(denom)
    if f_in.denominator == 1:
        if round(rem_in) == 12: 
            ft += 1
            in_str = "0"
        else:
            in_str = str(int(round(rem_in)))
    else:
        whole = int(f_in.numerator // f_in.denominator)
        rem = f_in.numerator % f_in.denominator
        if whole > 0: in_str = f"{whole} {rem}/{f_in.denominator}"
        else: in_str = f"{rem}/{f_in.denominator}"
        
    sign = "-" if val_inches < 0 else ""
    return f"{sign}{ft}ft {in_str}in"

def calculate(expr, mode, output_unit, precision_enabled, precision_denom):
    global debug_steps
    debug_steps = []
    log(f"--- Start Calculation: Mode={mode} ---")
    log(f"Expression: {expr}")
    
    try:
        if not expr or not expr.strip(): return ("—", "—", "—", [])
        
        # 1. Evaluate to float value
        if mode == "basic":
            val = evaluate_basic(expr)
            unit_suffix = ""
            is_ft_in = False
        else:
            val, has_unit, unit = evaluate_advanced(expr, output_unit)
            unit_suffix = f" {unit}" if has_unit and unit != "Feet-In" else ""
            is_ft_in = (has_unit and unit == "Feet-In")

        log(f"Evaluated Float: {val}")

        # 2. Format Outputs
        denom = precision_denom if precision_enabled else 1000000
        
        # Decimal
        decimal_str = f"{val:.4f}".rstrip('0').rstrip('.') + unit_suffix
        
        if is_ft_in:
            mixed_str = format_ft_in(val, denom)
            improper_str = format_improper(val, denom) + " in" 
        else:
            mixed_str = format_mixed(val, denom) + unit_suffix
            improper_str = format_improper(val, denom) + unit_suffix
        
        log(f"Formatted: Mixed={mixed_str}, Imp={improper_str}, Dec={decimal_str}")
        return (mixed_str, improper_str, decimal_str, debug_steps)
        
    except ZeroDivisionError:
        return ("Error", "Error", "Division by zero", debug_steps)
    except SyntaxError as e:
        return ("Error", "Error", str(e), debug_steps)
    except ValueError as e:
        msg = str(e)
        if "could not convert" in msg: return ("Error", "Error", "Invalid number", debug_steps)
        return ("Error", "Error", msg, debug_steps)
    except Exception as e:
        return ("Error", "Error", "Error: " + str(e), debug_steps)
`;