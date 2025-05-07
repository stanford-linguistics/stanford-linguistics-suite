import pipes


def get_safe_string(unsafe_string):
    """Quotes a string for safe use in shell commands."""
    return pipes.quote(unsafe_string)

def get_safe_list(unsafe_list):
    """Quotes each element in a list for safe use in shell commands."""
    return map(get_safe_string, unsafe_list)