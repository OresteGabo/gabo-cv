import type { IconType } from "react-icons";
import {
    SiAndroid,
    SiCplusplus,
    SiDocker,
    SiGit,
    SiGooglecloud,
    SiJetpackcompose,
    SiKotlin,
    SiKtor,
    SiNextdotjs,
    SiOpenapiinitiative,
    SiOpenjdk,
    SiPostgresql,
    SiSentry,
    SiSpringboot,
    SiSwift,
    SiTypescript,
} from "react-icons/si";
import { Bot, Braces, CloudCog, CodeXml, Database, Network, ShieldCheck } from "lucide-react";

const technologyIcons: Array<[string[], IconType]> = [
    [["compose multiplatform", "jetpack compose"], SiJetpackcompose],
    [["spring boot"], SiSpringboot],
    [["google cloud", "cloud run"], SiGooglecloud],
    [["postgresql"], SiPostgresql],
    [["typescript"], SiTypescript],
    [["next.js"], SiNextdotjs],
    [["openapi"], SiOpenapiinitiative],
    [["android"], SiAndroid],
    [["swiftui", "swift"], SiSwift],
    [["docker"], SiDocker],
    [["sentry"], SiSentry],
    [["kotlin", "kmp"], SiKotlin],
    [["ktor"], SiKtor],
    [["java"], SiOpenjdk],
    [["c++"], SiCplusplus],
    [["git"], SiGit],
    [["postgres", "sql"], Database],
    [["oauth", "jwt", "security"], ShieldCheck],
    [["mcp"], Network],
    [["koog", "ai"], Bot],
    [["api", "rest"], CodeXml],
    [["cloud"], CloudCog],
];

interface TechIconProps {
    name: string;
    className?: string;
    size?: number;
}

export const TechIcon = ({ name, className, size = 18 }: TechIconProps) => {
    const normalizedName = name.toLowerCase();
    const match = technologyIcons.find(([terms]) => terms.some((term) => normalizedName.includes(term)));
    const Icon = match?.[1] ?? Braces;

    return <Icon aria-hidden="true" className={className} size={size} />;
};
