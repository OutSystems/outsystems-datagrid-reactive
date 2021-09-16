// eslint-disable-next-line @typescript-eslint/no-unused-vars
namespace WijmoProvider.Helper.Translation {
    function transposeLanguageFormat(language: string): string {
        let changedLang = language;

        switch (language) {
            //the following languages exist in these variants
            case 'ar-AE':
            case 'ar-SA':
            case 'de-CH':
            case 'en-CA':
            case 'de-GB':
            case 'mn-MN':
            case 'zh-HK':
            case 'zh-TW':
                break;
            //all other languages, the provider doesn't have a local variant
            default:
                changedLang = language.substring(0, 2);
        }

        return changedLang;
    }

    export function SetLanguage(language: string, url: string): void {
        const regex = new RegExp('culture.(.*)(?=.min)');
        const transposedLanguage = transposeLanguageFormat(language);

        url = url.replace(url.match(regex)[1], transposedLanguage);

        fetch(url, { method: 'HEAD' }).then(function (response) {
            if (response.ok) {
                // this callback is wijmo's workaround to translate the group panel. Remove once they've fixed
                OSFramework.Helper.DynamicallyLoadScript(url, function () {
                    const gps = document.body.querySelectorAll(
                        '.wj-control.wj-grouppanel'
                    );
                    const culture = wijmo.culture;
                    for (let i = 0; i < gps.length; i++) {
                        const gp = wijmo.Control.getControl(gps[i]);
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        gp.placeholder = culture.GroupPanel.dragDrop;
                    }
                    wijmo.Control.invalidateAll();
                });
            } else {
                //if the language resource is not found in the server, then throw an error and let the english be the default language.
                throw `The language "${language}" is not supported. Falling back to the language in use.`;
            }
        });
    }
}
