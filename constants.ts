import { SecretPhrase } from './types';

export const SECRET_PHRASES: Record<string, SecretPhrase> = {
  'love': { mixed: 'I love you', decimal: '❤️' },
  'luv': { mixed: 'I luv you', decimal: '❤️' },
  'hello': { mixed: 'Hello there!', decimal: '👋' },
  'hi': { mixed: 'Hi to you too!', decimal: '👋' },
  'how are you': { mixed: 'I am fine, thanks', decimal: '😄' },
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

def parse_number(s):
    s = s.strip()
    if '..' in s or s.count('.') > 1:
        raise ValueError("Invalid number format")
    mixed_match = re.match(r'^(\\d+)\\s+(\\d+)/(\\d+)$', s)
    if mixed_match:
        whole, num, den = map(int, mixed_match.groups())
        return float(whole) + float(Fraction(num, den))
    if '/' in s:
        return float(Fraction(s))
    if s == '.': return 0.0
    return float(s) if s else 0.0

def parse_token_advanced(token):
    token = token.strip()
    unit_match = re.match(r'^([\\d\\s\\/\\.]+?)([a-zA-Z]+)$', token)
    if unit_match:
        value_str, unit = unit_match.groups()
        value = parse_number(value_str.strip())
        unit_lower = unit.lower()
        if unit_lower in ('ft','feet','foot'): unit = 'Feet'
        elif unit_lower in ('in','inch','inches'): unit = 'Inch'
        elif unit_lower in ('m','meter','meters'): unit = 'Meter'
        elif unit_lower in ('cm','centimeter','centimeters'): unit = 'Centimeter'
        elif unit_lower in ('mm','millimeter','millimeters'): unit = 'Millimeter'
        else: raise ValueError(f"Unsupported unit: {unit}")
        converted_value = value * UNITS[unit]
        return (converted_value, True)
    return (parse_number(token), False)

def preprocess_expression(expr):
    pattern = r'(\\d+(?:\\s+\\d+/\\d+|\\.\\d+)?(?:ft|feet))\\s*(\\d+(?:\\s+\\d+/\\d+|\\.\\d+)?(?:in|inch))'
    expr = re.sub(pattern, r'(\\1+\\2)', expr, flags=re.IGNORECASE)
    expr = re.sub(r'(?i)(\\d+(?:\\s+\\d+/\\d+|\\.\\d+)?)\\s+([a-zA-Z]+)', r'\\1\\2', expr)
    return expr

def tokenize_advanced(expression):
    pattern = r'(?:\\d+\\s+\\d+/\\d+|\\d+/\\d+|\\d+\\.\\d+|\\d+)(?:[a-zA-Z]+)?|[\\+\\-\\*\\/\\(\\)]'
    return re.findall(pattern, expression)

def evaluate_advanced(expression, output_unit):
    processed = preprocess_expression(expression)
    tokens = tokenize_advanced(processed)
    values, ops = [], []
    def apply_op(op, right, left):
        left_val, left_unit = left
        right_val, right_unit = right
        if op in ('*','/'):
            if left_unit and right_unit: raise ValueError("Unit error")
            res = left_val * right_val if op == '*' else (left_val / right_val if right_val != 0 else 0)
            return (res, left_unit or right_unit)
        elif op in ('+','-'):
            if left_unit != right_unit: raise ValueError("Unit mismatch")
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
    res_val, has_unit = values[0]
    
    if has_unit:
        if output_unit == "Feet-In":
            return res_val / UNITS["Inch"], True, output_unit
        return res_val / UNITS[output_unit], True, output_unit
    return res_val, False, None

def evaluate_basic(expression):
    from fractions import Fraction as _Fraction
    expr = expression.strip().replace('×','*').replace('÷','/').replace('−','-')
    expr = re.sub(r'(\\d+)\\s+(\\d+/\\d+)', r'(\\1+\\2)', expr)
    def frac_repl(m):
        a,b = m.group(0).split('/')
        return f'Fraction({a},{b})'
    expr = re.sub(r'\\b\\d+/\\d+\\b', frac_repl, expr)
    tree = ast.parse(expr, mode='eval')
    local_env = {'Fraction': _Fraction}
    res = eval(compile(tree, filename="<ast>", mode="eval"), {'__builtins__': None}, local_env)
    return float(res)

def format_mixed(val, denom):
    # Round to nearest grid
    val = round(val * denom) / denom
    f = Fraction(val).limit_denominator(denom)
    
    if f.denominator == 1: return str(f.numerator)
    whole = int(f.numerator // f.denominator)
    rem = abs(f.numerator) % f.denominator
    if rem == 0: return str(whole)
    if whole == 0: return f"{f.numerator}/{f.denominator}"
    return f"{whole} {rem}/{f.denominator}"

def format_improper(val, denom):
    # Round to nearest grid
    val = round(val * denom) / denom
    f = Fraction(val).limit_denominator(denom)
    return f"{f.numerator}/{f.denominator}"

def format_ft_in(val_inches, denom):
    # Round total inches to nearest precision first
    val_inches = round(val_inches * denom) / denom
    val = abs(val_inches)
    
    ft = int(val // 12)
    rem_in = val % 12
    
    # Format Inches part
    f_in = Fraction(rem_in).limit_denominator(denom)
    if f_in.denominator == 1:
        # Check if it rounds up to next inch
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
    try:
        if not expr or not expr.strip(): return ("—", "—", "—")
        
        # 1. Evaluate to float value
        if mode == "basic":
            val = evaluate_basic(expr)
            unit_suffix = ""
            is_ft_in = False
        else:
            val, has_unit, unit = evaluate_advanced(expr, output_unit)
            unit_suffix = f" {unit}" if has_unit and unit != "Feet-In" else ""
            is_ft_in = (has_unit and unit == "Feet-In")

        # 2. Format Outputs
        denom = precision_denom if precision_enabled else 1000000
        
        # Decimal
        decimal_str = f"{val:.4f}".rstrip('0').rstrip('.') + unit_suffix
        
        if is_ft_in:
            mixed_str = format_ft_in(val, denom)
            improper_str = format_improper(val, denom) + " in" # Feet-In improper is usually just total inches
        else:
            mixed_str = format_mixed(val, denom) + unit_suffix
            improper_str = format_improper(val, denom) + unit_suffix
            
        return (mixed_str, improper_str, decimal_str)
        
    except Exception as e:
        return ("Error", "Error", str(e))
`;