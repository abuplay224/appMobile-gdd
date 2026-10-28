import { EMPTY_REQUEST_FORM, toCreatePayload, validateRequestForm } from '../request.schema';

const valid = {
  ...EMPTY_REQUEST_FORM,
  customerName: 'Hôtel Kaloum',
  subject: 'Coupure du service',
  description: 'Depuis 7h ce matin, le système est inaccessible.',
};

describe('validateRequestForm', () => {
  it('accepte une saisie valide sans coordonnées (R01)', () => {
    expect(validateRequestForm(valid)).toEqual({});
  });

  it('refuse les champs obligatoires vides ou composés d’espaces (R02)', () => {
    const errors = validateRequestForm({ ...EMPTY_REQUEST_FORM, customerName: '   ' });
    expect(errors).toEqual({
      customerName: 'Indiquez le nom du client ou de l’entreprise.',
      subject: 'Indiquez l’objet de la demande.',
      description: 'Décrivez la demande du client.',
    });
  });

  it('mesure les longueurs après suppression des espaces de bord (R02)', () => {
    expect(validateRequestForm({ ...valid, customerName: ' A ' }).customerName).toBe(
      'Le nom doit contenir au moins 2 caractères.',
    );
    expect(validateRequestForm({ ...valid, subject: '  ab  ' }).subject).toBe(
      'L’objet doit contenir au moins 3 caractères.',
    );
    expect(validateRequestForm({ ...valid, description: 'trop court' + ' ' }).description).toBeUndefined();
    expect(validateRequestForm({ ...valid, description: 'court' }).description).toBe(
      'La description doit contenir au moins 10 caractères.',
    );
  });

  it('signale les dépassements avec la longueur actuelle (R02)', () => {
    expect(validateRequestForm({ ...valid, customerName: 'x'.repeat(151) }).customerName).toBe(
      '150 caractères maximum (actuellement 151).',
    );
    expect(validateRequestForm({ ...valid, description: 'x'.repeat(5001) }).description).toBe(
      '5 000 caractères maximum (actuellement 5001).',
    );
    expect(validateRequestForm({ ...valid, customerPhone: '1'.repeat(31) }).customerPhone).toBe(
      '30 caractères maximum (actuellement 31).',
    );
  });

  it('refuse un e-mail invalide avec un message compréhensible (R03)', () => {
    expect(validateRequestForm({ ...valid, customerEmail: 'nom@entreprise' }).customerEmail).toBe(
      'Adresse e-mail invalide. Exemple : nom@entreprise.com',
    );
    expect(validateRequestForm({ ...valid, customerEmail: 'nom@entreprise.com' })).toEqual({});
  });
});

describe('toCreatePayload', () => {
  it('conserve le téléphone tel que saisi, avec + et zéro initial (R04)', () => {
    const payload = toCreatePayload({ ...valid, customerPhone: '  +224 0622 45 78 90 ' });
    expect(payload.customerPhone).toBe('+224 0622 45 78 90');
  });

  it('n’interprète pas les balises : le texte est transmis tel quel (R19)', () => {
    const payload = toCreatePayload({ ...valid, description: "<script>alert(1)</script>'; DROP TABLE x;--" });
    expect(payload.description).toBe("<script>alert(1)</script>'; DROP TABLE x;--");
  });
});
