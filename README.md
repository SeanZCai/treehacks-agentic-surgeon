# Surgentic - AI-Powered Surgical Safety Assistant

Surgentic is a cutting-edge AI assistant designed to enhance surgical safety and compliance. By combining real-time voice interaction, screen recording, and automated checklist management, Surgentic ensures confidence and safety in every surgical procedure.

<img src="public/screenshot.png" alt="Surgentic Interface" />

## 🌟 Features

- Real-time AI voice interaction during procedures
- Automated surgical safety checklist management
- Screen recording and session playback
- Beautiful, modern interface with dark mode
- Compliance report generation
- Persistent conversation history
- Real-time transcription
- Responsive design optimized for medical environments

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 15
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [Supabase](https://supabase.com)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Voice AI**: [ElevenLabs](https://elevenlabs.io/)

## 📦 Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/surgentic
cd surgentic
```

2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:

```bash
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
XI_API_KEY="your-elevenlabs-api-key"
AGENT_ID="your-elevenlabs-agent-id"
```

4. Run the development server:

```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗️ Project Structure

- `/app` - Next.js app directory containing routes and layouts
- `/components` - Reusable React components
- `/lib` - Utility functions and shared logic
- `/public` - Static assets and recorded sessions

## 🔑 Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `XI_API_KEY`: ElevenLabs API key
- `AGENT_ID`: ElevenLabs agent ID

## 🏥 Features in Detail

### Real-time Voice Interaction
Surgentic provides seamless voice communication during surgical procedures, allowing hands-free interaction with the AI assistant.

### Surgical Safety Checklist
An interactive checklist based on WHO Surgical Safety standards, ensuring all critical steps are followed and documented.

### Screen Recording
Built-in screen recording capabilities allow for procedure documentation and later review, enhancing training and quality assurance.

### Compliance Reporting
Automated generation of compliance reports based on checklist completion and procedure documentation.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 References

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ElevenLabs Documentation](https://elevenlabs.io/docs)
- [WHO Surgical Safety Checklist](https://www.who.int/teams/integrated-health-services/patient-safety/research/safe-surgery)

## 👥 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.
