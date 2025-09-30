# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: Login
      - generic [ref=e6]: Enter your credentials to access your account
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email
          - textbox "Email" [ref=e11]
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - textbox "Password" [ref=e14]
      - generic [ref=e15]:
        - button "Login" [ref=e16]
        - paragraph [ref=e17]:
          - text: Don't have an account?
          - link "Register" [ref=e18] [cursor=pointer]:
            - /url: /register
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e24] [cursor=pointer]:
    - img [ref=e25] [cursor=pointer]
  - alert [ref=e28]
```