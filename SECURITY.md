# Security Policy

## Supported Versions

We take the security of Smart Macro Tool seriously. This document outlines our security policy and procedures.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

📧 **security@smart-macro-tool.com**

We will acknowledge receipt of your vulnerability report within 48 hours and send you regular updates about our progress.

### What to Include

When reporting a vulnerability, please include:

- **Description**: Clear description of the vulnerability
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Impact**: What could an attacker achieve?
- **Affected Versions**: Which versions are affected?
- **Proof of Concept**: If possible, include a PoC
- **Your Contact**: How can we reach you?

### Response Timeline

| Phase | Timeline | Action |
|-------|----------|--------|
| Acknowledgment | 48 hours | We acknowledge receipt |
| Initial Assessment | 7 days | We assess and validate |
| Fix Development | 30 days | We develop and test fix |
| Disclosure | After fix | Public disclosure with credit |

## Security Measures

### Data Protection

- **Local Storage**: User data is stored locally by default
- **No Cloud Upload**: Files are not uploaded to external servers
- **Encryption**: Sensitive configuration is encrypted at rest
- **Secure Communication**: All API communications use HTTPS

### AI Security

- **Review Required**: AI suggestions must be approved before application
- **Sandboxed Execution**: AI operations are sandboxed
- **Input Validation**: All AI inputs are validated
- **Confidence Scoring**: Low-confidence suggestions are flagged

### File Handling

- **Path Traversal Protection**: User input is sanitized to prevent path traversal
- **File Type Validation**: Only allowed file types are processed
- **Size Limits**: File uploads have size restrictions
- **Virus Scanning**: Optional integration with antivirus

## Security Best Practices for Users

### 1. Keep Software Updated

Always use the latest version of Smart Macro Tool. Security updates are released regularly.

### 2. Verify Downloads

Download only from official sources:
- GitHub Releases
- Official website
- Trusted package managers

### 3. Use Strong Authentication

If using cloud features:
- Use strong passwords
- Enable two-factor authentication
- Regularly rotate API keys

### 4. Review AI Suggestions

Always review AI-generated suggestions before applying:
- Check cell references
- Verify formulas
- Preview changes
- Test on backup copies

### 5. Backup Your Data

Regularly backup important files:
- Use version control for critical data
- Maintain offline backups
- Test restore procedures

## Known Security Considerations

### Excel File Parsing

- Excel files may contain macros
- We disable macro execution by default
- Malicious formulas are sanitized

### Formula Injection

- User input in formulas is validated
- Dangerous functions are blocked
- Circular references are detected

### AI Integration

- AI providers may process data
- Review provider privacy policies
- Use local AI when possible (Ollama)

## Security Checklist for Contributors

When contributing code, ensure:

- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Output encoding to prevent XSS
- [ ] SQL injection prevention (if applicable)
- [ ] Path traversal protection
- [ ] Secure random number generation
- [ ] No debug code in production
- [ ] Security headers in HTTP responses
- [ ] Rate limiting on API endpoints
- [ ] CORS properly configured

## Security Testing

We regularly perform:

- **Static Analysis**: Using ESLint, Bandit, and other tools
- **Dependency Scanning**: Automated vulnerability scanning
- **Penetration Testing**: Annual third-party assessments
- **Code Reviews**: Security-focused reviews

## Security Tools

### Recommended for Development

```bash
# Frontend security linting
cd src/frontend
npm audit
npm run lint:security

# Backend security scanning
cd src/backend
bandit -r app/
safety check

# Dependency scanning
snyk test
```

## Incident Response

In case of a security incident:

1. **Immediate**: Assess severity and impact
2. **Containment**: Stop the vulnerability
3. **Investigation**: Determine root cause
4. **Remediation**: Develop and deploy fix
5. **Communication**: Notify affected users
6. **Post-Incident**: Review and improve

## Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [SANS Top 25](https://www.sans.org/top25-software-errors/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Electron Security](https://www.electronjs.org/docs/latest/tutorial/security)

## Contact

For security-related inquiries:

- **Email**: security@smart-macro-tool.com
- **GPG Key**: [Download Public Key](https://smart-macro-tool.com/security.gpg)
- **Status Page**: [status.smart-macro-tool.com](https://status.smart-macro-tool.com)

## Acknowledgments

We thank the following security researchers who have responsibly disclosed vulnerabilities:

*This section will be updated as researchers contribute.*

---

**Last Updated**: February 2026

**Version**: 1.0
