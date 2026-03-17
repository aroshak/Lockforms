import {
    getGeneralSettings,
    getSecurityPolicies,
    getLdapConfig,
    getSamlConfig,
    getAiConfig,
    getLicenseStatus,
    getApiKeys,
    getWebhooks,
} from './actions';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
    const [general, policies, ldap, saml, ai, license, apiKeys, webhooks] = await Promise.all([
        getGeneralSettings(),
        getSecurityPolicies(),
        getLdapConfig(),
        getSamlConfig(),
        getAiConfig(),
        getLicenseStatus(),
        getApiKeys(),
        getWebhooks(),
    ]);

    return (
        <SettingsClient
            general={general}
            policies={policies}
            ldap={ldap}
            saml={saml}
            ai={ai}
            license={license}
            apiKeys={apiKeys}
            webhooks={webhooks}
        />
    );
}
