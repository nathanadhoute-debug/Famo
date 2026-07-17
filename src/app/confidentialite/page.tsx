import Link from "next/link";
import { Logo } from "@/components/Logo";
import { c, font } from "@/lib/theme";

export const metadata = {
  title: "Politique de confidentialité — Famō",
};

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: font.display, fontSize: 22, color: c.sage900, margin: "40px 0 14px", fontWeight: 500 }}>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontSize: 15.5, color: c.sage900, margin: "22px 0 8px", fontWeight: 600 }}>
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15, lineHeight: 1.75, color: c.ink, margin: "0 0 14px" }}>{children}</p>;
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ margin: "0 0 14px", paddingLeft: 22 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 15, lineHeight: 1.75, color: c.ink, marginBottom: 6 }}>{item}</li>
      ))}
    </ul>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", margin: "0 0 20px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: `2px solid ${c.hairline}`, color: c.sub, fontWeight: 600 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "10px 12px", borderBottom: `1px solid ${c.hairline}`, color: c.ink, verticalAlign: "top" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ConfidentialitePage() {
  return (
    <div style={{ background: c.cream, minHeight: "100vh" }}>
      <header style={{ borderBottom: `1px solid ${c.line}`, padding: "20px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <Link href="/"><Logo size={24} /></Link>
        </div>
      </header>

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 96px" }}>
        <p style={{ fontSize: 12, color: c.eyebrow, textTransform: "uppercase", letterSpacing: "1.5px", margin: 0 }}>
          Famō — famo.health
        </p>
        <h1 style={{ fontFamily: font.display, fontSize: 34, color: c.sage900, margin: "8px 0 6px", fontWeight: 500 }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: 14, color: c.sub, margin: "0 0 8px" }}>Dernière mise à jour : 13 juillet 2026</p>

        <H2>1. Préambule</H2>
        <P>
          La présente politique de confidentialité (« la Politique ») a pour objet d&apos;informer les utilisateurs
          du service Famō (« le Service »), accessible à l&apos;adresse famo.health, sur la manière dont leurs
          données à caractère personnel sont collectées, traitées, conservées, sécurisées et sur les droits dont
          ils disposent à cet égard. Elle est établie conformément au Règlement (UE) 2016/679 du Parlement
          européen et du Conseil du 27 avril 2016 (« RGPD ») et à la loi n°78-17 du 6 janvier 1978 modifiée
          relative à l&apos;informatique, aux fichiers et aux libertés (« Loi Informatique et Libertés »).
        </P>
        <P>En créant un compte et en utilisant le Service, l&apos;utilisateur reconnaît avoir pris connaissance de la présente Politique.</P>

        <H2>2. Définitions</H2>
        <Ul items={[
          <><strong>Donnée à caractère personnel</strong> : toute information se rapportant à une personne physique identifiée ou identifiable.</>,
          <><strong>Traitement</strong> : toute opération portant sur des données personnelles (collecte, enregistrement, conservation, modification, consultation, communication, effacement, etc.).</>,
          <><strong>Responsable du traitement</strong> : la personne qui détermine les finalités et les moyens du traitement.</>,
          <><strong>Sous-traitant</strong> : la personne qui traite des données personnelles pour le compte du responsable du traitement.</>,
          <><strong>Cercle familial</strong> : le groupe d&apos;utilisateurs constitué autour d&apos;un même proche accompagné, disposant d&apos;un accès partagé aux données le concernant.</>,
        ]} />

        <H2>3. Responsable du traitement</H2>
        <P>Le responsable du traitement des données collectées via le Service est :</P>
        <P><strong>M. Adhoute</strong>, exerçant sous le nom commercial <strong>Famō</strong><br />Adresse de contact : contact@famo.health</P>
        <P>
          Cette mention légale sera mise à jour avec la dénomination sociale, la forme juridique et le numéro
          d&apos;immatriculation (SIRET) dès la constitution d&apos;une structure juridique dédiée à l&apos;exploitation
          du Service. Jusqu&apos;à cette immatriculation, le responsable du traitement est l&apos;exploitant individuel du Service.
        </P>
        <P>
          Aucun délégué à la protection des données (DPO) n&apos;est formellement désigné à ce stade, le Service
          ne remplissant pas les critères de désignation obligatoire prévus à l&apos;article 37 du RGPD. Toute
          question relative à la protection des données peut néanmoins être adressée à contact@famo.health,
          qui fait office de point de contact unique.
        </P>

        <H2>4. Données collectées</H2>
        <H3>4.1 Données de compte</H3>
        <P>
          Nom, prénom, adresse email, mot de passe. Le mot de passe est stocké sous forme hachée (chiffrement à
          sens unique) par notre prestataire d&apos;authentification ; il n&apos;est à aucun moment accessible en clair,
          y compris par nous-mêmes ou par nos équipes.
        </P>
        <H3>4.2 Données relatives au proche accompagné</H3>
        <P>
          Nom, date de naissance, notes libres. Ces informations sont saisies volontairement par les membres du
          cercle familial et concernent une tierce personne (le proche accompagné), qui n&apos;est généralement pas
          elle-même utilisatrice directe du Service.
        </P>
        <H3>4.3 Données de santé</H3>
        <P>Sont collectées, à la seule initiative des utilisateurs :</P>
        <Ul items={[
          "Médicaments suivis : nom, dosage, catégorie thérapeutique, caractère critique, horaires de prise ;",
          "Historique des prises (administré ou non, horodatage, auteur de la saisie) ;",
          "Informations d'ordonnance : libellé, date d'expiration ;",
          "Mesures de suivi : tension artérielle, poids, glycémie, température, pouls, saturation en oxygène, et toute autre mesure libre saisie par l'utilisateur ;",
          "Entrées de journal (texte libre, horodaté, avec étiquettes thématiques telles que « santé », « humeur », « urgence ») ;",
          "Documents téléversés : ordonnances, comptes-rendus médicaux, résultats d'analyses, et tout autre document déposé par les utilisateurs.",
        ]} />
        <P>
          Ces données relèvent de la catégorie des <strong>données concernant la santé</strong>, données sensibles
          au sens de l&apos;article 9, paragraphe 1, du RGPD. Leur traitement repose exclusivement sur le
          <strong> consentement explicite</strong> de la personne qui les saisit (article 9, paragraphe 2, point a).
          Aucune de ces données n&apos;est collectée par un moyen automatisé ou déduite par inférence : elles résultent
          uniquement d&apos;une saisie manuelle et volontaire.
        </P>
        <H3>4.4 Données de coordination familiale</H3>
        <P>
          Planning des visites (dates, personne assignée, notes), historique des invitations envoyées et acceptées
          au sein d&apos;un cercle, rôle de chaque membre (administrateur, membre, lecture seule).
        </P>
        <H3>4.5 Données techniques et de connexion</H3>
        <P>
          Adresse IP, horodatage des connexions, identifiant de session. Deux cookies techniques sont déposés : un
          cookie d&apos;authentification (maintien de la session) et un cookie fonctionnel mémorisant, pour un cercle
          suivant plusieurs proches, lequel est actuellement consulté ; aucun autre cookie n&apos;est utilisé (voir section 12).
        </P>
        <H3>4.6 Minimisation des données</H3>
        <P>
          Conformément au principe de minimisation posé par l&apos;article 5, paragraphe 1, point c) du RGPD, seules
          les données strictement nécessaires au fonctionnement du Service sont collectées.
        </P>

        <H2>5. Finalités du traitement</H2>
        <Table
          head={["Finalité", "Données concernées", "Base légale"]}
          rows={[
            ["Création et gestion du compte utilisateur", "Données de compte", "Exécution du contrat"],
            ["Coordination entre membres d'un même cercle familial", "Toutes les données saisies dans le cercle", "Exécution du contrat"],
            ["Suivi médical et de santé du proche accompagné", "Données de santé", "Consentement explicite"],
            ["Envoi de notifications opérationnelles", "Email, données déclenchant l'alerte", "Exécution du contrat"],
            ["Sécurité et prévention de la fraude", "Données techniques et de connexion", "Intérêt légitime"],
          ]}
        />
        <P>
          Il est expressément précisé qu&apos;<strong>aucune donnée n&apos;est utilisée à des fins de prospection
          commerciale, de profilage publicitaire, de revente à des tiers, ni de prise de décision entièrement
          automatisée</strong>{" "}produisant des effets juridiques au sens de l&apos;article 22 du RGPD.
        </P>

        <H2>6. Destinataires des données</H2>
        <H3>6.1 Au sein du Service</H3>
        <P>
          Les données d&apos;un cercle familial ne sont accessibles qu&apos;aux membres de ce cercle. L&apos;isolation entre
          cercles distincts est garantie par des mécanismes techniques au niveau de la base de données (politiques
          de sécurité au niveau ligne), empêchant tout accès croisé entre familles.
        </P>
        <H3>6.2 Sous-traitants techniques</H3>
        <Table
          head={["Catégorie de destinataire", "Rôle", "Localisation"]}
          rows={[
            ["Hébergeur de la base de données", "Hébergement de la base de données, authentification, stockage de fichiers", "Royaume-Uni"],
            ["Hébergeur de l'application", "Hébergement de l'application web", "États-Unis"],
            ["Prestataire d'envoi d'emails", "Envoi des emails transactionnels (confirmation, invitations, rappels)", "États-Unis"],
          ]}
        />
        <P>
          Chacun de ces sous-traitants agit exclusivement sur instruction du responsable du traitement, dans le
          cadre défini par des conditions contractuelles intégrant les garanties exigées par l&apos;article 28 du
          RGPD. Aucun de ces prestataires n&apos;est autorisé à utiliser les données à ses propres fins. La liste
          précise et à jour des sous-traitants et de leurs coordonnées peut être communiquée sur simple demande
          à contact@famo.health.
        </P>
        <H3>6.3 Absence de sous-traitance en cascade non maîtrisée</H3>
        <P>
          Le Service ne fait appel à aucun sous-traitant additionnel autre que ceux listés ci-dessus pour le
          traitement direct des données personnelles des utilisateurs. Toute évolution de cette liste fera
          l&apos;objet d&apos;une mise à jour de la présente Politique.
        </P>

        <H2>7. Transferts de données hors Union européenne</H2>
        <P>
          Les données hébergées par notre hébergeur de base de données le sont au Royaume-Uni, pays bénéficiant
          d&apos;une décision d&apos;adéquation de la Commission européenne (décision d&apos;exécution du 28 juin 2021),
          permettant leur transfert sans garantie contractuelle supplémentaire.
        </P>
        <P>
          Les données transitant par notre hébergeur d&apos;application et notre prestataire d&apos;envoi d&apos;emails,
          établis aux États-Unis, font l&apos;objet d&apos;un encadrement par les clauses contractuelles types adoptées
          par la Commission européenne et/ou par l&apos;adhésion de ces prestataires au cadre de certification
          EU-U.S. Data Privacy Framework, lorsque applicable.
        </P>

        <H2>8. Durée de conservation</H2>
        <Table
          head={["Catégorie de données", "Durée de conservation"]}
          rows={[
            ["Données de compte actif", "Durée de vie du compte"],
            ["Données de santé et de journal", "Durée de vie du compte, ou jusqu'à suppression manuelle"],
            ["Compte supprimé à la demande de l'utilisateur", "Suppression ou anonymisation sous 30 jours"],
            ["Invitations non acceptées", "Expiration automatique après 7 jours"],
            ["Journaux techniques de connexion", "12 mois maximum"],
          ]}
        />
        <P>
          À l&apos;issue de ces durées, les données sont supprimées définitivement ou anonymisées de manière
          irréversible, sauf obligation légale de conservation plus longue s&apos;imposant au responsable du
          traitement ou à ses sous-traitants.
        </P>

        <H2>9. Sécurité des données</H2>
        <P>Le Service met en œuvre les mesures techniques et organisationnelles suivantes, proportionnées à la nature sensible des données traitées :</P>
        <Ul items={[
          "Chiffrement des mots de passe par hachage à sens unique, sans possibilité de récupération en clair ;",
          "Chiffrement des données en transit (HTTPS/TLS) sur l'intégralité du Service ;",
          "Isolation stricte des données entre cercles familiaux au niveau de la base de données (Row Level Security) ;",
          "Vérification systématique de l'appartenance à un cercle avant toute écriture de donnée sensible, effectuée côté serveur ;",
          "Limitation stricte des accès administratifs aux données de production.",
        ]} />
        <H3>9.1 Violation de données</H3>
        <P>
          En cas de violation de données à caractère personnel susceptible d&apos;engendrer un risque pour les droits
          et libertés des personnes concernées, le responsable du traitement s&apos;engage à notifier la CNIL dans un
          délai de 72 heures à compter de la prise de connaissance de la violation, conformément à l&apos;article 33
          du RGPD, et à informer les personnes concernées sans délai injustifié lorsque le risque est élevé,
          conformément à l&apos;article 34.
        </P>

        <H2>10. Mineurs</H2>
        <P>
          Le Service n&apos;est pas destiné à être utilisé directement par des personnes mineures. Les informations
          relatives à un proche accompagné peuvent concerner une personne âgée, mais celle-ci n&apos;est pas tenue de
          créer elle-même un compte : ce sont les membres majeurs de son entourage qui saisissent et gèrent ces
          informations en son nom, dans le cadre de l&apos;aide qu&apos;ils lui apportent.
        </P>

        <H2>11. Vos droits</H2>
        <P>Conformément aux articles 15 à 22 du RGPD, toute personne concernée dispose des droits suivants :</P>
        <Ul items={[
          <><strong>Droit d&apos;accès</strong> (article 15) : obtenir la confirmation qu&apos;une donnée la concernant est traitée, et en obtenir une copie ;</>,
          <><strong>Droit de rectification</strong> (article 16) : corriger une donnée inexacte ou incomplète ;</>,
          <><strong>Droit à l&apos;effacement</strong> (article 17) : demander la suppression de ses données, sous réserve des obligations légales de conservation ;</>,
          <><strong>Droit à la limitation du traitement</strong> (article 18) ;</>,
          <><strong>Droit à la portabilité</strong> (article 20) : recevoir les données fournies dans un format structuré, couramment utilisé et lisible par machine ;</>,
          <><strong>Droit d&apos;opposition</strong> (article 21), pour les traitements fondés sur l&apos;intérêt légitime ;</>,
          <><strong>Droit de retirer son consentement</strong> à tout moment, sans affecter la licéité du traitement effectué avant ce retrait ;</>,
          <><strong>Droit de définir des directives</strong> relatives au sort de ses données après son décès, conformément à l&apos;article 85 de la Loi Informatique et Libertés.</>,
        ]} />
        <H3>11.1 Modalités d&apos;exercice</H3>
        <P>
          Ces droits peuvent être exercés en adressant une demande à <strong>contact@famo.health</strong>, accompagnée
          d&apos;un justificatif d&apos;identité en cas de doute raisonnable sur l&apos;identité du demandeur. Une réponse est
          apportée dans un délai d&apos;un mois à compter de la réception de la demande, pouvant être prolongé de deux
          mois supplémentaires en cas de demande complexe.
        </P>
        <H3>11.2 Réclamation auprès de l&apos;autorité de contrôle</H3>
        <P>
          Si une personne concernée estime que ses droits ne sont pas respectés, elle dispose du droit d&apos;introduire
          une réclamation auprès de la <strong>Commission Nationale de l&apos;Informatique et des Libertés (CNIL)</strong> :
          3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — cnil.fr
        </P>

        <H2>12. Cookies et traceurs</H2>
        <P>
          Le Service dépose deux cookies techniques :
        </P>
        <Ul items={[
          <>Un cookie de session, indispensable à l&apos;authentification.</>,
          <>Un cookie fonctionnel mémorisant, pour un cercle suivant plusieurs proches, lequel est actuellement consulté — pour éviter d&apos;avoir à le resélectionner à chaque page.</>,
        ]} />
        <P>
          Ces deux cookies sont strictement nécessaires à la fourniture du service demandé par l&apos;utilisateur et
          sont, à ce titre, exemptés de recueil du consentement au titre de l&apos;article 82 de la Loi Informatique
          et Libertés.
        </P>
        <P>
          <strong>Aucun cookie de mesure d&apos;audience, publicitaire, de traçage tiers ou de profilage n&apos;est déposé.</strong>
          {" "}Le Service ne recourt à aucun outil d&apos;analytics tiers à la date de la présente Politique.
        </P>

        <H2>13. Décisions automatisées</H2>
        <P>
          Le Service dérive un indicateur d&apos;état général du proche accompagné (par exemple : « calme » ou
          « nécessite attention ») à partir de règles simples et transparentes (retard de prise de médicament,
          mesure hors norme, mention d&apos;urgence dans le journal). Cet indicateur est purement informatif, ne
          produit aucun effet juridique ni ne donne lieu à une décision automatisée au sens de l&apos;article 22 du
          RGPD : il ne fait qu&apos;informer les utilisateurs, qui restent seuls décisionnaires de toute action à entreprendre.
        </P>

        <H2>14. Modification de la présente Politique</H2>
        <P>
          La présente Politique peut être modifiée à tout moment pour refléter une évolution du Service, de la
          réglementation ou des sous-traitants utilisés. Toute modification substantielle sera portée à la
          connaissance des utilisateurs par email, au moins 15 jours avant son entrée en vigueur. La date de
          dernière mise à jour figure en en-tête du présent document.
        </P>

        <H2>15. Droit applicable et juridiction compétente</H2>
        <P>
          La présente Politique est soumise au droit français. Tout litige relatif à son interprétation ou son
          exécution relève, à défaut de résolution amiable, de la compétence des juridictions françaises.
        </P>

        <H2>16. Contact</H2>
        <P>
          Pour toute question relative à la présente Politique ou à l&apos;exercice de vos droits :{" "}
          <strong>contact@famo.health</strong>
        </P>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${c.hairline}` }}>
          <Link href="/" style={{ color: c.sage700, fontSize: 14, fontWeight: 600 }}>← Retour à l&apos;accueil</Link>
        </div>
      </main>
    </div>
  );
}
