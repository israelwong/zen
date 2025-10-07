import React from 'react';
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

interface AgentCredentialsEmailProps {
    agentName: string;
    email: string;
    password: string;
    loginUrl: string;
}

export const AgentCredentialsEmail = ({
    agentName,
    email,
    password,
    loginUrl,
}: AgentCredentialsEmailProps) => {
    return (
        <Html>
            <Head />
            <Body style={bodyStyle}>
                <Container style={containerStyle}>
                    <Text style={titleStyle}>¡Bienvenido a ZEN Platform!</Text>
                    <Text style={textStyle}>
                        Hola {agentName},
                    </Text>
                    <Text style={textStyle}>
                        Tu cuenta de agente ha sido creada exitosamente. Aquí están tus credenciales:
                    </Text>
                    <Text style={credentialsStyle}>
                        <strong>Email:</strong> {email}<br />
                        <strong>Contraseña:</strong> {password}
                    </Text>
                    <Button style={buttonStyle} href={loginUrl}>
                        Iniciar Sesión
                    </Button>
                    <Text style={footerStyle}>
                        Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

const bodyStyle = {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Arial, sans-serif',
};

const containerStyle = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
};

const titleStyle = {
    fontSize: '24px',
    lineHeight: '1.3',
    fontWeight: '700',
    color: '#484848',
    margin: '0 0 20px',
};

const textStyle = {
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#484848',
    margin: '0 0 16px',
};

const credentialsStyle = {
    fontSize: '16px',
    lineHeight: '1.4',
    color: '#484848',
    backgroundColor: '#f4f4f4',
    padding: '16px',
    borderRadius: '8px',
    margin: '16px 0',
};

const buttonStyle = {
    backgroundColor: '#007ee6',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'block',
    padding: '12px 20px',
    margin: '20px 0',
};

const footerStyle = {
    fontSize: '14px',
    lineHeight: '1.4',
    color: '#8898aa',
    margin: '20px 0 0',
};

export default AgentCredentialsEmail;
