import {
    getGeneralSettings,
    getSecurityPolicies,
    getLdapConfig,
    getSamlConfig,
    getAiConfig,
    getLicenseStatus,
} from './actions';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
    const [general, policies, ldap, saml, ai, license] = await Promise.all([
        getGeneralSettings(),
        getSecurityPolicies(),
        getLdapConfig(),
        getSamlConfig(),
        getAiConfig(),
        getLicenseStatus(),
    ]);

    return (
        <SettingsClient
            general={general}
            policies={policies}
            ldap={ldap}
            saml={saml}
            ai={ai}
            license={license}
        />
    );
}
